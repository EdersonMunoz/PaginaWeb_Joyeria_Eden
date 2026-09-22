function ProductCard({producto, agregarAlCarrito}) {
return(
    <figure className="card">
        <div className="img-container">
            <img src={producto.imagen} alt={producto.nombre}/>
        </div>
        <figcaption>
            <h3>{producto.nombre}</h3>
            <p className="precio">${producto.precio}.000 COP</p>
        </figcaption>
        <button className="btn-agregar" onClick={() => agregarAlCarrito(producto)}>agregar al carrito</button>
    </figure>
)
}
export default ProductCard