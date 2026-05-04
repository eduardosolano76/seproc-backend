package com.example.demo.modelo;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import jakarta.persistence.Id;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Data
@Table(name = "solicitud_institucion")
public class SolicitudInstitucion {
	
	@Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_solicitud")
    private Integer idSolicitud;

    @Column(name = "nombre_dependencia", nullable = false, length = 200)
    private String nombreDependencia;

    @Column(name = "abreviacion", length = 50)
    private String abreviacion;

    @Column(name = "nombre_contacto", nullable = false, length = 250)
    private String nombreContacto;

    @Column(name = "email_contacto", nullable = false, length = 100)
    private String emailContacto;

    @Column(name = "telefono_contacto", length = 20)
    private String telefonoContacto;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false)
    private EstadoSolicitud estado = EstadoSolicitud.PENDIENTE;

    @CreationTimestamp
    @Column(name = "fecha_solicitud", updatable = false)
    private LocalDateTime fechaSolicitud;

    @Column(name = "fecha_resolucion")
    private LocalDateTime fechaResolucion;

}
