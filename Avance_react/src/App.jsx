import { useState } from 'react'
import './App.css'
import ProductCard from './ProductCard'


const PRODUCTOS = [
    {
        id: 1,
        nombre: 'Valentino Uomo Born In Roma',
        precio: 80,
        imagen: 'https://dimg.dillards.com/is/image/DillardsZoom/mainProduct/valentino-uomo-born-in-roma-eau-de-toilette-spray/20046225_zi.jpg'
    },
    {
        id: 2,
        nombre: 'Jean Paul Gaultier Le Beau EDP Intense',
        precio: 92,
        imagen: 'https://i.ebayimg.com/images/g/Pv0AAOSw4aBl2-1m/s-l1200.jpg'
    }

]
const estilosModal = {
    marginTop: '15px',
    padding: '20px',
    backgroundColor: 'black',
    border: '1px solid #ddd',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    position: 'absolute',
    zIndex: 10,
    width: '300px'
};
function App() {
    const [carrito, setCarrito] = useState([])
    const [mostrarcarrito, setMostrarcarrito] = useState(false)

    const agregarAlCarrito = (producto) => {
        // 1. Buscamos si el producto ya está guardado en el arreglo del carrito
        const productoExistente = carrito.find((item) => item.id === producto.id);

        if (productoExistente) {
            // 2. Si ya existe, recorremos el carrito y le sumamos 1 a la cantidad de ese producto
            const carritoActualizado = carrito.map((item) =>
                item.id === producto.id
                    ? { ...item, cantidad: item.cantidad + 1 }
                    : item
            );
            setCarrito(carritoActualizado);
        } else {
            // 3. Si es la primera vez que se agrega, lo guardamos agregándole la propiedad "cantidad: 1"
            setCarrito([...carrito, { ...producto, cantidad: 1 }]);
        }
    };
    const btncarrito=()=>{
        setMostrarcarrito(!mostrarcarrito)
    }
    const totalArticulos = carrito.reduce((total, item) => total + item.cantidad, 0);
    const precioTotal = carrito.reduce((total,item)=>total + item.precio* item.cantidad, 0);
    return (
        <div className="container">
            <header className="header">
                <h1 className="logo">EDEN</h1>
                <div className="badge-carrito">

                    <button className="btn-agregar" onClick={btncarrito}>
                        🛒 {totalArticulos}{mostrarcarrito ?' cerrar ventana':' abrir ventana'}
                    </button>
                    {mostrarcarrito && (
                        <div style={estilosModal}>
                            {carrito.map((item)=>(
                                <div className="vistacarrito">
                                    <p>{item.nombre}</p>
                                    <p>{item.cantidad}</p>
                                </div>
                            ))}
                            <p>cantidad a pagar {precioTotal}.000</p>
                        </div>
                )}

                </div>
            </header>

            <main className="catalogo">
                {PRODUCTOS.map((producto) => (
                    /* 2. Lo usamos exactamente igual que antes */
                    <ProductCard
                        key={producto.id}
                        producto={producto}
                        agregarAlCarrito={agregarAlCarrito}
                    />
                ))}

            </main>
        </div>
    )
}

export default App