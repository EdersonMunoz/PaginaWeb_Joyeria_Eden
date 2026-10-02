import fondoMenu from "../assets/fondoMenu.png";
import anilloMenu from "../assets/anilloMenu.png";
import pendientesMenu from "../assets/pendientesMenu.png";
import collarMenu from "../assets/collarMenu.png";

function Banner() {
  return (
    <div
      style={{
        flex: 1,
        width: "100%",
        padding: "0 40px",
        boxSizing: "border-box",
        backgroundColor: "#FFFFFF",
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Contenedor de la imagen principal */}
      <div
        style={{
          width: "100%",
          height: "72vh", // Altura fija en vista para dejar espacio abajo
          position: "relative",
          borderRadius: "8px",
          overflow: "hidden",
          marginTop: "10px",
          marginBottom: "40px", 
        }}
      >
        <img
          src={fondoMenu}
          alt="Banner Joyería"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />

        {/* Texto dentro de la imagen */}
        <div
          style={{
            position: "absolute",
            top: "12%",
            left: "6%",
            width: "55%",
            backgroundColor: "rgba(0, 0, 0, 0.25)",
            borderRadius: "20px",
            padding: "3rem 3rem",
            boxSizing: "border-box",
            zIndex: "5",
          }}
        >
          <p
            style={{
              margin: "0 0 0.5rem 0",
              fontSize: "1rem",
              letterSpacing: "2px",
              color: "#FFFFFF",
            }}
          >
            Joyería y Perfumería
          </p>
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
              fontWeight: "300",
              letterSpacing: "6px",
              color: "#FFFFFF",
              lineHeight: "1.1",
            }}
          >
            EDEN
          </h1>
        </div>

        {/* Las tres tarjetitas (anillo, pendientes, collar) */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "16px",
            position: "absolute",
            bottom: "20px",
            left: 0,
            right: 0,
            padding: "0 20px",
            zIndex: "10",
          }}
        >
          <img
            src={anilloMenu}
            alt="Anillo"
            style={{
              width: "240px",
              height: "148px",
              objectFit: "cover",
              borderRadius: "8px",
            }}
          />
          <img
            src={pendientesMenu}
            alt="Pendientes"
            style={{
              width: "155px",
              height: "148px",
              objectFit: "cover",
              borderRadius: "8px",
            }}
          />
          <img
            src={collarMenu}
            alt="Collar"
            style={{
              width: "200px",
              height: "148px",
              objectFit: "cover",
              borderRadius: "8px",
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default Banner;
