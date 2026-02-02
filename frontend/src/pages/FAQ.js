import React, { useState } from 'react';
import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';

const FAQ = () => {
  const faqs = [
    {
      id: 'faq-1',
      question: '¿Qué es GOCAST.me?',
      answer: 'Es una plataforma online donde talentos y productoras pueden conectarse para participar y gestionar castings profesionales.'
    },
    {
      id: 'faq-2',
      question: '¿GOCAST.me es una agencia o representa talentos?',
      answer: 'No. Solo ofrecemos la tecnología para que talentos y productoras se encuentren. No intervenimos en decisiones de casting ni contratación.'
    },
    {
      id: 'faq-3',
      question: '¿Cómo funciona para talentos?',
      answer: 'Creas tu perfil, subes fotos, videos, tu experiencia y recibís invitaciones a castings según tu tipo de perfil.'
    },
    {
      id: 'faq-4',
      question: '¿Cómo funciona para productoras y agencias?',
      answer: 'Crean castings, filtran talentos por criterios específicos e invitan solo a quienes cumplen lo que buscan.'
    },
    {
      id: 'faq-5',
      question: '¿GOCAST.me garantiza trabajo?',
      answer: 'No. El objetivo es acercar oportunidades, pero la decisión final siempre depende de la productora o cliente.'
    },
    {
      id: 'faq-6',
      question: '¿Qué pasa con mis fotos o contenido?',
      answer: 'Siguen siendo tuyos. Solo autorizas que aparezcan en tu perfil dentro de GOCAST.me.'
    },
    {
      id: 'faq-7',
      question: '¿GOCAST.me participa en pagos o contratos entre talento y productora?',
      answer: 'No. Todas las negociaciones son externas a la plataforma.'
    },
    {
      id: 'faq-8',
      question: '¿Qué costo tiene crear un perfil?',
      answer: 'El primer año es gratuito. Luego existe un plan anual muy accesible para mantener tu perfil activo.'
    },
    {
      id: 'faq-9',
      question: '¿Puedo borrar mi cuenta cuando quiera?',
      answer: 'Sí. Puedes eliminar tu perfil en cualquier momento desde tu panel de usuario.'
    },
    {
      id: 'faq-10',
      question: '¿Qué pasa si recibo una invitación falsa o sospechosa?',
      answer: 'Puedes reportarla. Investigamos y, si corresponde, bloqueamos al usuario infractor.'
    }
  ];

  return (
    <div className="gocast-page">
      <div className="gocast-container">
        <div className="content-page">
          <h1 className="page-title" data-testid="faq-title">Preguntas Frecuentes</h1>
          <p className="page-subtitle">Encuentra respuestas a las preguntas más comunes sobre GOCAST.me</p>
          
          <div className="faq-container">
            <Accordion.Root type="single" collapsible className="accordion-root">
              {faqs.map((faq) => (
                <Accordion.Item key={faq.id} value={faq.id} className="accordion-item" data-testid={faq.id}>
                  <Accordion.Trigger className="accordion-trigger">
                    <span className="accordion-question">{faq.question}</span>
                    <ChevronDown className="accordion-icon" aria-hidden />
                  </Accordion.Trigger>
                  <Accordion.Content className="accordion-content">
                    <div className="accordion-answer">{faq.answer}</div>
                  </Accordion.Content>
                </Accordion.Item>
              ))}
            </Accordion.Root>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;