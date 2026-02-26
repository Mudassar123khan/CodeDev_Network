import "./Spinner.css";

export default function Spinner({ fullPage = false }) {
  return (
    <div className={fullPage ? "spinner-container full" : "spinner-container"}>
      <div className="spinner"></div>
    </div>
  );
}