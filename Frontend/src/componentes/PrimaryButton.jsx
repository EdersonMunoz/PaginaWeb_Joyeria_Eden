function PrimaryButton({ children, type = "button", onClick }) {
  return (
    <button className="primary-button" type={type} onClick={onClick}>
      {children}
    </button>
  );
}

export default PrimaryButton;
