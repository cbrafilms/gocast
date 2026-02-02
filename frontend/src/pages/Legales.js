import React from 'react';

const Legales = () => {
  return (
    <div className="gocast-page">
      <div className="gocast-container">
        <div className="content-page">
          <h1 className="page-title" data-testid="legal-title">Términos Legales</h1>
          
          <div className="page-content legal-content">
            <p className="content-paragraph">
              GOCAST.me es una plataforma tecnológica que actúa únicamente como intermediario digital entre talentos y productoras, 
              agencias o empresas que publican proyectos en el sitio.
            </p>
            
            <p className="content-paragraph">
              No participamos en procesos de selección, contratación, negociación de tarifas, validación de identidades, cumplimiento 
              de trabajos ni en la calidad o veracidad de los proyectos publicados. Toda comunicación, acuerdo, pago o relación laboral 
              o comercial se realiza directamente entre el talento y la productora.
            </p>
            
            <p className="content-paragraph">
              GOCAST.me no se hace responsable por el contenido que los talentos publican en sus perfiles (fotos, videos, descripciones 
              o material audiovisual), ni por la información presentada en castings creados por terceros. Cada usuario es responsable 
              del contenido que publica y de las interacciones que realiza dentro y fuera de la plataforma.
            </p>
            
            <p className="content-paragraph">
              Al usar GOCAST.me, los usuarios aceptan que la plataforma es un medio de contacto y no una parte involucrada en ningún 
              tipo de relación profesional o contractual.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Legales;