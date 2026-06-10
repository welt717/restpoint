import React from "react";
import { User, Tag, HeartPulse, Clock, CalendarClock, X } from "lucide-react";

const Colors = {
  successGreen: "#06b10f",
  dangerRed: "#ff1900",
};

// Styled Components (inline definitions)
const ModalOverlay = ({ children, onClick }) => (
  <div
    onClick={onClick}
    style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      backdropFilter: "blur(3px)",
    }}
  >
    {children}
  </div>
);

const ModalContent = ({ children, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: "#fff",
      borderRadius: "16px",
      padding: "24px",
      width: "90%",
      maxWidth: "500px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      animation: "fadeIn 0.3s ease-in-out",
      position: "relative",
    }}
  >
    {children}
  </div>
);

const ModalHeader = ({ children }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottom: "1px solid #e5e7eb",
      paddingBottom: "10px",
      marginBottom: "20px",
    }}
  >
    {children}
  </div>
);

const ModalTitle = ({ children }) => (
  <h2
    style={{
      fontSize: "1.2rem",
      fontWeight: "600",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      color: "#111827",
    }}
  >
    {children}
  </h2>
);

const CloseButton = ({ onClick, children }) => (
  <button
    onClick={onClick}
    style={{
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "#6b7280",
      transition: "0.3s",
    }}
    onMouseEnter={(e) => (e.target.style.color = "#ff1900")}
    onMouseLeave={(e) => (e.target.style.color = "#6b7280")}
  >
    {children}
  </button>
);

const ModalInfoItem = ({ children }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "14px",
    }}
  >
    {children}
  </div>
);

const ModalInfoLabel = ({ children }) => (
  <span
    style={{
      display: "flex",
      alignItems: "center",
      gap: "6px",
      fontWeight: "500",
      color: "#374151",
      width: "45%",
    }}
  >
    {children}
  </span>
);

const ModalInfoValue = ({ children }) => (
  <span
    style={{
      color: "#111827",
      fontWeight: "400",
      width: "55%",
      textAlign: "right",
    }}
  >
    {children}
  </span>
);

const Badge = ({ bgColor, children }) => (
  <span
    style={{
      backgroundColor: bgColor,
      color: "#fff",
      padding: "4px 10px",
      borderRadius: "8px",
      fontSize: "0.8rem",
      fontWeight: "600",
    }}
  >
    {children}
  </span>
);

// Main Component
const DeceasedInfoModal = ({ isOpen, onClose, deceased, ageInfo }) => {
  if (!isOpen || !deceased) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            <User size={24} />
            Deceased Details
          </ModalTitle>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </ModalHeader>

        <ModalInfoItem>
          <ModalInfoLabel>
            <User size={16} /> Full Name:
          </ModalInfoLabel>
          <ModalInfoValue>{deceased.full_name}</ModalInfoValue>
        </ModalInfoItem>

        <ModalInfoItem>
          <ModalInfoLabel>
            <Tag size={16} /> Mortuary ID:
          </ModalInfoLabel>
          <ModalInfoValue>{deceased.mortuary_id}</ModalInfoValue>
        </ModalInfoItem>

        <ModalInfoItem>
          <ModalInfoLabel>
            <HeartPulse size={16} /> Status:
          </ModalInfoLabel>
          <ModalInfoValue>
            <Badge
              bgColor={
                deceased.status === "Active"
                  ? Colors.successGreen
                  : Colors.dangerRed
              }
            >
              {deceased.status}
            </Badge>
          </ModalInfoValue>
        </ModalInfoItem>

        <ModalInfoItem>
          <ModalInfoLabel>
            <Clock size={16} /> Age:
          </ModalInfoLabel>
          <ModalInfoValue>
            {ageInfo.years} years ({ageInfo.category})
          </ModalInfoValue>
        </ModalInfoItem>

        <ModalInfoItem>
          <ModalInfoLabel>
            <CalendarClock size={16} /> Date Admitted:
          </ModalInfoLabel>
          <ModalInfoValue>
            {deceased.date_admitted
              ? new Date(deceased.date_admitted).toLocaleDateString()
              : "N/A"}
          </ModalInfoValue>
        </ModalInfoItem>
      </ModalContent>
    </ModalOverlay>
  );
};

export default DeceasedInfoModal;
