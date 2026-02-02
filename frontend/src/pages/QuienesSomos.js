import React from 'react';

const QuienesSomos = () => {
  return (
    <div className="gocast-page">
      <div className="gocast-container">
        <div className="content-page">
          <h1 className="page-title" data-testid="about-title">Quiénes Somos</h1>
          
          <div className="page-content">
            <p className="content-paragraph">
              GOCAST.me es una plataforma creada para simplificar y profesionalizar el proceso de casting en Latinoamérica. 
              Conectamos talentos con productoras audiovisuales, agencias y marcas que necesitan encontrar rápidamente el perfil 
              adecuado para cada proyecto. Nuestro objetivo es ofrecer un espacio moderno, claro y eficiente, donde cada talento 
              pueda mostrar su trabajo y cada productora pueda gestionar castings de forma ordenada, segura y sin fricciones.
            </p>
            
            <p className="content-paragraph">
              No somos una agencia. No representamos talentos. No participamos en decisiones de contratación. Somos una herramienta 
              que facilita el encuentro entre quienes buscan y quienes ofrecen talento creativo. Diseñamos GOCAST.me para que el 
              proceso sea transparente, directo y accesible, tanto para productoras grandes como para proyectos independientes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuienesSomos;