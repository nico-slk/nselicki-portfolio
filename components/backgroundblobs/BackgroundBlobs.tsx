'use client'
import { useEffect, useState } from 'react';

// Sub-componente para cada nube individual
const Blob = ({ className }: { className: string; }) => {
  // Estado para almacenar las coordenadas X e Y del desplazamiento aleatorio
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Función que genera nuevas coordenadas aleatorias
    const moveBlob = () => {
      // Math.random() * 200 - 100 genera un rango de -100 a 100 píxeles
      const x = Math.floor(Math.random() * 400) - 200;
      const y = Math.floor(Math.random() * 400) - 200;
      // Actualizamos el estado para disparar el re-renderizado y la transición CSS
      setPosition({ x, y });
    };

    // Ejecutamos una vez al montar para que no arranquen todos en (0,0)
    moveBlob();

    // Creamos un intervalo que cambia la posición cada 2.2 segundos
    const interval = setInterval(moveBlob, 5000);

    // Función de limpieza: detiene el intervalo si el componente se desmonta
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`
        absolute
        rounded-full
        transform-gpu
        will-change-transform

        bg-[radial-gradient(circle,rgba(var(--secondary-rgb),0.2)_0%,rgba(var(--primary-rgb),0.15)_70%)]

        blur-[90px]

        transition-transform
        duration-5000
        ease-in-out

        ${className}
      `}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`
      }}
    />
  );
};

const BackgroundBlobs = () => {
  return (
    <div
      className="
        fixed
        inset-0
        -z-10
        overflow-hidden
        pointer-events-none
      "
    >
      <Blob
        className="
          absolute
          rounded-full

          w-[50vw]
          h-[50vw]

          top-[-5%]
          left-[-5%]

          md:top-[-10%]
          md:left-[-10%]
          md:w-[clamp(25vw,40vw,400px)]
          md:h-[clamp(25vw,40vw,400px)]

          lg:w-[clamp(30vw,50vw,600px)]
          lg:h-[clamp(30vw,50vw,600px)]
        "
      />
      <Blob
        className="
          absolute
          rounded-full
          top-[10%]
          right-[10%]
          w-[40vw]
          h-[40vw]

          md:w-[clamp(20vw,35vw,350px)]
          md:h-[clamp(20vw,35vw,350px)]

          lg:w-[clamp(25vw,40vw,500px)]
          lg:h-[clamp(25vw,40vw,500px)]

        "
      />
      <Blob
        className="
          absolute
          rounded-full
          top-[30%]
          right-[-10%]
          w-[35vw]
          h-[35vw]

          md:w-[clamp(15vw, 30vw, 300px)]
          md:h-[clamp(15vw, 30vw, 300px)]

          lg:w-[clamp(20vw, 35vw, 450px)]
          lg:h-[clamp(20vw, 35vw, 450px)]
        "
      />
      <Blob
        className="
          absolute
          rounded-full
          top-[45%]
          right-[-10%]
          w-[45vw]
          h-[45vw]

          md:w-[clamp(25vw, 40vw, 400px)]
          md:h-[clamp(25vw, 40vw, 400px)]
          md:right-[-5%]

          lg:w-[clamp(30vw, 50vw, 600px)]
          lg:h-[clamp(30vw, 50vw, 600px)]
          lg:top-[50%]
        "
      />
      {/* <Blob className={styles.middleBottomLeft} /> */}
      <Blob
        className="
          absolute
          rounded-full
          top-[70%]
          left-[-5%]
          w-[30vw]
          h-[30vw]

          md:w-[clamp(15vw, 25vw, 280px)]
          md:h-[clamp(15vw, 25vw, 280px)]

          lg:w-[clamp(18vw, 30vw, 400px)]
          lg:h-[clamp(18vw, 30vw, 400px)]
          lg:top-[65%]
        "
      />
      {/* <Blob className={styles.bottomLeft} /> */}
      <Blob
        className="
          absolute
          rounded-full
          top-[85%]
          right-[-10%]
          w-[40vw]
          h-[40vw]

          md:w-[clamp(20vw, 35vw, 350px)]
          md:h-[clamp(20vw, 35vw, 350px)]
          md:right-[-5%]

          lg:w-[clamp(28vw, 45vw, 550px)]
          lg:h-[clamp(28vw, 45vw, 550px)]
          lg:top-[80%]
        "
      />
    </div>
  );
};

export default BackgroundBlobs;
