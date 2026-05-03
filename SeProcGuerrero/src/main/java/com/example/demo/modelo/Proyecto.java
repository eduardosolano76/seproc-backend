package com.example.demo.modelo;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Data
@Table(name = "proyecto")
public class Proyecto {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id_proyecto")
	private Integer idProyecto;

	@OneToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "id_solicitud", nullable = false, unique = true)
	private SolicitudProyecto solicitud;

	@Column(name = "id_usuario_supervisor", nullable = false)
	private Long idUsuarioSupervisor;

	@Column(name = "estado_proyecto", nullable = false)
	private String estadoProyecto; // ACTIVO/INACTIVO/RECHAZADO/FINALIZADO

	@Column(name = "fecha_aprobacion", nullable = false)
	private LocalDateTime fechaAprobacion;

	@PrePersist
	void prePersist() {
		if (fechaAprobacion == null)
			fechaAprobacion = LocalDateTime.now();
		if (estadoProyecto == null)
			estadoProyecto = "ACTIVO";
	}

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "id_institucion", nullable = false)
	private Institucion institucion;

}