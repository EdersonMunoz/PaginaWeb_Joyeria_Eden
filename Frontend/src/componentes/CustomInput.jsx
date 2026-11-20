import { useState } from "react";

function EyeIcon({ crossed }) {
  return (
    <svg
      aria-hidden="true"
      className="custom-input-eye-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {crossed ? (
        <>
          <path d="m3 3 18 18" />
          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
          <path d="M9.9 5.2A10.7 10.7 0 0 1 12 5c5.1 0 8.5 4.8 9.5 7a17 17 0 0 1-3.1 4.1" />
          <path d="M6.6 6.6C4.8 8 3.5 10 2.5 12c1 2.2 4.4 7 9.5 7 1.1 0 2.1-.2 3-.6" />
        </>
      ) : (
        <>
          <path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
          <circle cx="12" cy="12" r="2.5" />
        </>
      )}
    </svg>
  );
}

function CustomInput({
  icon,
  label,
  type = "text",
  iconClassName = "",
  value,
  onChange,
  autoComplete,
  required = true,
  error = false,
}) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";

  return (
    <label className={`custom-input${error ? " custom-input-error" : ""}`}>
      {typeof icon === "string" ? (
        <img
          src={icon}
          alt=""
          className={`custom-input-icon ${iconClassName}`.trim()}
        />
      ) : (
        <span className="custom-input-icon">{icon}</span>
      )}
      <input
        aria-label={label}
        type={isPassword && !visible ? "password" : "text"}
        placeholder={label}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={error}
      />
      {isPassword && value && (
        <button
          type="button"
          className="custom-input-toggle"
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          onClick={() => setVisible((current) => !current)}
        >
          <EyeIcon crossed={visible} />
        </button>
      )}
    </label>
  );
}

export default CustomInput;
