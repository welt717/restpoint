<?php

namespace App\Http\Controllers\Api;

use App\Models\DocumentTemplate;
use App\Models\TemplateField;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TemplateController extends Controller
{
    /**
     * Get all templates for tenant
     */
    public function index(Request $request): JsonResponse
    {
        $tenantId = $request->header('X-Tenant-ID');
        $includePublic = $request->query('include_public', true);

        $query = DocumentTemplate::where('tenant_id', $tenantId);

        if ($includePublic) {
            $query->orWhere('is_public', true);
        }

        $templates = $query
            ->with('fields')
            ->orderBy('is_default', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $templates
        ]);
    }

    /**
     * Create a new template
     */
    public function store(Request $request): JsonResponse
    {
        $tenantId = $request->header('X-Tenant-ID');
        $userId = $request->header('X-User-ID');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|string|max:50',
            'template_json' => 'nullable|array',
            'fields' => 'nullable|array',
            'default_fields' => 'nullable|array',
            'is_public' => 'sometimes|boolean'
        ]);

        try {
            $template = DocumentTemplate::create([
                'tenant_id' => $tenantId,
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'type' => $validated['type'],
                'template_json' => json_encode($validated['template_json'] ?? []),
                'default_fields' => json_encode($validated['default_fields'] ?? []),
                'is_public' => $validated['is_public'] ?? false,
                'created_by' => $userId
            ]);

            // Add template fields
            if (isset($validated['fields'])) {
                foreach ($validated['fields'] as $index => $field) {
                    TemplateField::create([
                        'template_id' => $template->id,
                        'field_key' => $field['field_key'],
                        'field_label' => $field['field_label'] ?? null,
                        'field_type' => $field['field_type'] ?? 'text',
                        'placeholder' => $field['placeholder'] ?? null,
                        'is_required' => $field['is_required'] ?? false,
                        'default_value' => $field['default_value'] ?? null,
                        'options' => json_encode($field['options'] ?? []),
                        'position' => $index
                    ]);
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Template created successfully',
                'data' => $template->load('fields')
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create template: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a specific template
     */
    public function show(Request $request, $id): JsonResponse
    {
        $template = DocumentTemplate::with('fields')->find($id);

        if (!$template) {
            return response()->json([
                'success' => false,
                'message' => 'Template not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $template
        ]);
    }

    /**
     * Update a template
     */
    public function update(Request $request, $id): JsonResponse
    {
        $template = DocumentTemplate::find($id);

        if (!$template) {
            return response()->json([
                'success' => false,
                'message' => 'Template not found'
            ], 404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'type' => 'sometimes|string|max:50',
            'template_json' => 'nullable|array',
            'default_fields' => 'nullable|array',
            'fields' => 'nullable|array',
            'is_public' => 'sometimes|boolean'
        ]);

        try {
            if (isset($validated['name'])) {
                $template->name = $validated['name'];
            }
            if (isset($validated['description'])) {
                $template->description = $validated['description'];
            }
            if (isset($validated['type'])) {
                $template->type = $validated['type'];
            }
            if (isset($validated['template_json'])) {
                $template->template_json = json_encode($validated['template_json']);
            }
            if (isset($validated['default_fields'])) {
                $template->default_fields = json_encode($validated['default_fields']);
            }
            if (isset($validated['is_public'])) {
                $template->is_public = $validated['is_public'];
            }

            $template->save();

            // Update fields if provided
            if (isset($validated['fields'])) {
                $template->fields()->delete();
                foreach ($validated['fields'] as $index => $field) {
                    TemplateField::create([
                        'template_id' => $template->id,
                        'field_key' => $field['field_key'],
                        'field_label' => $field['field_label'] ?? null,
                        'field_type' => $field['field_type'] ?? 'text',
                        'placeholder' => $field['placeholder'] ?? null,
                        'is_required' => $field['is_required'] ?? false,
                        'default_value' => $field['default_value'] ?? null,
                        'options' => json_encode($field['options'] ?? []),
                        'position' => $index
                    ]);
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Template updated successfully',
                'data' => $template->load('fields')
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update template: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a template
     */
    public function destroy($id): JsonResponse
    {
        $template = DocumentTemplate::find($id);

        if (!$template) {
            return response()->json([
                'success' => false,
                'message' => 'Template not found'
            ], 404);
        }

        try {
            $template->delete();

            return response()->json([
                'success' => true,
                'message' => 'Template deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a document from template
     */
    public function createFromTemplate(Request $request, $id): JsonResponse
    {
        $tenantId = $request->header('X-Tenant-ID');
        $userId = $request->header('X-User-ID');

        $template = DocumentTemplate::find($id);

        if (!$template) {
            return response()->json([
                'success' => false,
                'message' => 'Template not found'
            ], 404);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'initial_fields' => 'nullable|array'
        ]);

        try {
            $document = $template->createDocument(
                $validated['title'],
                $tenantId,
                $userId,
                $validated['initial_fields'] ?? []
            );

            return response()->json([
                'success' => true,
                'message' => 'Document created from template',
                'data' => $document->load('fields', 'template.fields')
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create document: ' . $e->getMessage()
            ], 500);
        }
    }
}
