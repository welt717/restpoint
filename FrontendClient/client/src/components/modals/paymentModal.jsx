import React, { useState } from 'react';
import { DollarSign, Smartphone, Building2, CreditCard, CheckCircle, CircleX, X } from 'lucide-react';

const PaymentUpdateModal = ({ isOpen, onClose, deceasedId, deceasedName }) => {
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: '',
    reference: '',
    phoneNumber: '',
    bankName: '',
    transactionDate: new Date().toISOString().split('T')[0],
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePaymentMethodSelect = (method) => {
    setPaymentData((prev) => ({
      ...prev,
      paymentMethod: method,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('http://localhost:8009/api/v1/restpoint/update-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deceasedId,
          ...paymentData,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Payment updated successfully!' });
        setPaymentData({
          amount: '',
          paymentMethod: '',
          reference: '',
          phoneNumber: '',
          bankName: '',
          transactionDate: new Date().toISOString().split('T')[0],
        });
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to update payment' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSTKPush = async () => {
    if (!paymentData.amount || !paymentData.phoneNumber) {
      setMessage({ type: 'error', text: 'Please enter amount and phone number for STK push' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('http://localhost:8009/api/v1/restpoint/initiate-stk-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deceasedId,
          amount: paymentData.amount,
          phoneNumber: paymentData.phoneNumber,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'STK push initiated successfully! Check your phone to complete payment.' });
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to initiate STK push' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.title}>
            <DollarSign size={22} style={{ marginRight: 8 }} />
            Update Payment for {deceasedName}
          </div>
          <button style={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>
              <DollarSign size={16} style={styles.icon} />
              Amount (Ksh)
            </label>
            <input
              type="number"
              name="amount"
              value={paymentData.amount}
              onChange={handleInputChange}
              placeholder="Enter amount"
              required
              min="0"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Payment Method</label>
            <div style={styles.paymentOptions}>
              <button
                type="button"
                style={{
                  ...styles.option,
                  ...(paymentData.paymentMethod === 'mpesa' ? styles.optionSelected : {}),
                }}
                onClick={() => handlePaymentMethodSelect('mpesa')}
              >
                <Smartphone size={18} style={{ marginRight: 6 }} />
                MPESA
              </button>
              <button
                type="button"
                style={{
                  ...styles.option,
                  ...(paymentData.paymentMethod === 'bank' ? styles.optionSelected : {}),
                }}
                onClick={() => handlePaymentMethodSelect('bank')}
              >
                <Building2 size={18} style={{ marginRight: 6 }} />
                Bank
              </button>
            </div>
          </div>

          {paymentData.paymentMethod === 'mpesa' && (
            <>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <Smartphone size={16} style={styles.icon} />
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={paymentData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="07XX XXX XXX"
                  pattern="[0-9]{10}"
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <CreditCard size={16} style={styles.icon} />
                  MPESA Reference
                </label>
                <input
                  type="text"
                  name="reference"
                  value={paymentData.reference}
                  onChange={handleInputChange}
                  placeholder="Enter reference number"
                  required
                  style={styles.input}
                />
              </div>
            </>
          )}

          {paymentData.paymentMethod === 'bank' && (
            <>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <Building2 size={16} style={styles.icon} />
                  Bank Name
                </label>
                <input
                  type="text"
                  name="bankName"
                  value={paymentData.bankName}
                  onChange={handleInputChange}
                  placeholder="Enter bank name"
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <CreditCard size={16} style={styles.icon} />
                  Transaction Reference
                </label>
                <input
                  type="text"
                  name="reference"
                  value={paymentData.reference}
                  onChange={handleInputChange}
                  placeholder="Enter reference number"
                  required
                  style={styles.input}
                />
              </div>
            </>
          )}

          <div style={styles.formGroup}>
            <label style={styles.label}>Transaction Date</label>
            <input
              type="date"
              name="transactionDate"
              value={paymentData.transactionDate}
              onChange={handleInputChange}
              required
              style={styles.input}
            />
          </div>

          <button
            type="submit"
            style={{
              ...styles.submitButton,
              backgroundColor: loading ? '#ccc' : '#007bff',
            }}
            disabled={loading || !paymentData.paymentMethod || !paymentData.amount}
          >
            {loading ? 'Processing...' : 'Update Payment'}
            {!loading && <CheckCircle size={16} style={{ marginLeft: 6 }} />}
          </button>

          {paymentData.paymentMethod === 'mpesa' &&
            paymentData.amount &&
            paymentData.phoneNumber && (
              <button
                type="button"
                style={styles.stkButton}
                onClick={handleSTKPush}
                disabled={loading}
              >
                Send STK Push
                <Smartphone size={16} style={{ marginLeft: 6 }} />
              </button>
            )}

          {message.text && (
            <div
              style={{
                ...styles.statusMessage,
                color: message.type === 'success' ? 'green' : 'red',
              }}
            >
              {message.type === 'success' ? (
                <CheckCircle size={16} style={{ marginRight: 6 }} />
              ) : (
                <CircleX size={16} style={{ marginRight: 6 }} />
              )}
              {message.text}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

// Inline Styles
const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    width: '90%',
    maxWidth: '520px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #eee',
    marginBottom: '16px',
    paddingBottom: '8px',
  },
  title: {
    fontWeight: '600',
    fontSize: '1.1rem',
    display: 'flex',
    alignItems: 'center',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#444',
  },
  formGroup: {
    marginBottom: '14px',
  },
  label: {
    display: 'block',
    fontWeight: '500',
    marginBottom: '6px',
  },
  icon: {
    marginRight: '6px',
    verticalAlign: 'middle',
  },
  input: {
    width: '100%',
    padding: '8px 10px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    outline: 'none',
    fontSize: '0.95rem',
  },
  paymentOptions: {
    display: 'flex',
    gap: '10px',
  },
  option: {
    flex: 1,
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #ccc',
    backgroundColor: '#f9f9f9',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '500',
  },
  optionSelected: {
    backgroundColor: '#007bff',
    color: '#fff',
    border: '1px solid #007bff',
  },
  submitButton: {
    width: '100%',
    color: '#fff',
    padding: '10px 0',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '1rem',
    marginTop: '10px',
  },
  stkButton: {
    width: '100%',
    backgroundColor: '#28a745',
    color: '#fff',
    padding: '10px 0',
    border: 'none',
    borderRadius: '8px',
    marginTop: '8px',
    cursor: 'pointer',
    fontWeight: '500',
  },
  statusMessage: {
    marginTop: '14px',
    display: 'flex',
    alignItems: 'center',
    fontWeight: '500',
  },
};

export default PaymentUpdateModal;
