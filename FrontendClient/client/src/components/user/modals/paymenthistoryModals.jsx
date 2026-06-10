import React, { useEffect, useState } from 'react';
import { Modal, Button, Table, Form } from 'react-bootstrap';
import axios from 'axios';

const PaymentHistoryModal = ({ show, onClose, deceasedId }) => {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (show && deceasedId) {
      fetchPayments();
    }
  }, [show, deceasedId]);

  const fetchPayments = async () => {
    try {
      const res = await axios.get(`/api/payments/${deceasedId}`);
      if (res.data.success) {
        setPayments(res.data.data);
        setFilteredPayments(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
    }
  };

  const handleFilterChange = (e) => {
    const value = e.target.value.toLowerCase();
    setFilter(value);

    const filtered = payments.filter(p =>
      p.payment_method.toLowerCase().includes(value) ||
      (p.description && p.description.toLowerCase().includes(value))
    );
    setFilteredPayments(filtered);
  };

  return (
    <Modal show={show} onHide={onClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Payment History</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Control
          type="text"
          placeholder="Filter by method or description..."
          value={filter}
          onChange={handleFilterChange}
          className="mb-3"
        />
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <Table striped bordered hover size="sm">
            <thead>
              <tr>
                <th>#</th>
                <th>Amount</th>
                <th>Currency</th>
                <th>Method</th>
                <th>Description</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length > 0 ? (
                filteredPayments.map((p, idx) => (
                  <tr key={p.payment_id}>
                    <td>{idx + 1}</td>
                    <td>{p.amount.toFixed(2)}</td>
                    <td>{p.currency}</td>
                    <td>{p.payment_method || '-'}</td>
                    <td>{p.description || '-'}</td>
                    <td>{new Date(p.payment_date).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center">No payments found</td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PaymentHistoryModal;
