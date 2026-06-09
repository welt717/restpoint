<?php

namespace App\Http\Controllers\Api;

use App\Models\Document;
use App\Models\DocumentTemplate;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class DocumentController extends Controller
{
    /**
     * Get all documents for a tenant
     */
    public function index(Request $request): JsonResponse
    {
        $tenantId = $request->header('X-Tenant-ID');
        $status = $request->query('status');
        $templateId = $request->query('template_id');

        $query = Document::forTenantQuery($tenantId);

        if ($status) {
            $query->where('status', $status);
        }

        if ($templateId) {
            $query->where('template_id', $templateId);
        }

        $documents = $query
            ->with('fields', 'template')
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $documents->items(),
            'pagination' => [
                'total' => $documents->total(),
                'per_page' => $documents->perPage(),
                'current_page' => $documents->currentPage(),
                'last_page' => $documents->lastPage()
            ]
        ]);
    }

    /**
     * Create a new document
     */
    public function store(Request $request): JsonResponse
    {
        $tenantId = $request->header('X-Tenant-ID');
        $userId = $request->header('X-User-ID');

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'template_id' => 'nullable|integer',
            'initial_fields' => 'nullable|array'
        ]);

        try {
            $document = Document::create([
                'tenant_id' => $tenantId,
                'template_id' => $validated['template_id'],
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'created_by' => $userId,
                'status' => 'draft'
            ]);

            // Add fields
            if (isset($validated['initial_fields'])) {
                $document->fillFields($validated['initial_fields']);
            }

            // Create initial version
            $document->createVersion(
                ['created' => true],
                $userId,
                'Document created'
            );

            return response()->json([
                'success' => true,
                'message' => 'Document created successfully',
                'data' => $document->load('fields', 'versions')
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create document: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a specific document
     */
    public function show(Request $request, $id): JsonResponse
    {
        $tenantId = $request->header('X-Tenant-ID');

        $document = Document::forTenant($tenantId, $id);

        if (!$document) {
            return response()->json([
                'success' => false,
                'message' => 'Document not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $document->load('fields', 'versions', 'template.fields')
        ]);
    }

    /**
     * Update document
     */
    public function update(Request $request, $id): JsonResponse
    {
        $tenantId = $request->header('X-Tenant-ID');
        $userId = $request->header('X-User-ID');

        $document = Document::forTenant($tenantId, $id);

        if (!$document) {
            return response()->json([
                'success' => false,
                'message' => 'Document not found'
            ], 404);
        }

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'content' => 'nullable|string',
            'canvas_state' => 'nullable|array',
            'fields' => 'nullable|array',
            'reason' => 'nullable|string'
        ]);

        try {
            $changes = [];

            if (isset($validated['title']) && $validated['title'] !== $document->title) {
                $changes['title'] = $validated['title'];
                $document->title = $validated['title'];
            }

            if (isset($validated['canvas_state'])) {
                $changes['canvas_state'] = 'updated';
                $document->canvas_state = $validated['canvas_state'];
            }

            if (isset($validated['content'])) {
                $changes['content'] = 'updated';
                $document->content = $validated['content'];
            }

            if (isset($validated['fields'])) {
                $document->fillFields($validated['fields']);
                $changes['fields'] = count($validated['fields']) . ' fields updated';
            }

            $document->save();

            // Create version if there are changes
            if (!empty($changes)) {
                $document->createVersion(
                    $changes,
                    $userId,
                    $validated['reason'] ?? 'Document updated'
                );
            }

            return response()->json([
                'success' => true,
                'message' => 'Document updated successfully',
                'data' => $document->load('fields', 'versions')
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update document: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Publish a document
     */
    public function publish(Request $request, $id): JsonResponse
    {
        $tenantId = $request->header('X-Tenant-ID');
        $userId = $request->header('X-User-ID');

        $document = Document::forTenant($tenantId, $id);

        if (!$document) {
            return response()->json([
                'success' => false,
                'message' => 'Document not found'
            ], 404);
        }

        try {
            $document->publish();
            $document->createVersion(
                ['status' => 'published'],
                $userId,
                'Document published'
            );

            return response()->json([
                'success' => true,
                'message' => 'Document published successfully',
                'data' => $document
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to publish: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a document
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $tenantId = $request->header('X-Tenant-ID');

        $document = Document::forTenant($tenantId, $id);

        if (!$document) {
            return response()->json([
                'success' => false,
                'message' => 'Document not found'
            ], 404);
        }

        try {
            $document->delete();

            return response()->json([
                'success' => true,
                'message' => 'Document deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete document: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get document versions
     */
    public function versions(Request $request, $id): JsonResponse
    {
        $tenantId = $request->header('X-Tenant-ID');

        $document = Document::forTenant($tenantId, $id);

        if (!$document) {
            return response()->json([
                'success' => false,
                'message' => 'Document not found'
            ], 404);
        }

        $versions = $document->versions()->get();

        return response()->json([
            'success' => true,
            'data' => $versions
        ]);
    }

    /**
     * Restore a specific version
     */
    public function restoreVersion(Request $request, $id, $versionId): JsonResponse
    {
        $tenantId = $request->header('X-Tenant-ID');
        $userId = $request->header('X-User-ID');

        $document = Document::forTenant($tenantId, $id);

        if (!$document) {
            return response()->json([
                'success' => false,
                'message' => 'Document not found'
            ], 404);
        }

        $version = $document->versions()->find($versionId);

        if (!$version) {
            return response()->json([
                'success' => false,
                'message' => 'Version not found'
            ], 404);
        }

        try {
            if ($version->canvas_snapshot) {
                $document->canvas_state = $version->canvas_snapshot;
            }

            $document->save();

            $document->createVersion(
                ['restored_from' => $version->version_number],
                $userId,
                'Restored from version ' . $version->version_number
            );

            return response()->json([
                'success' => true,
                'message' => 'Document restored successfully',
                'data' => $document
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to restore: ' . $e->getMessage()
            ], 500);
        }
    }
}
