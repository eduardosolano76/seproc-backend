package com.example.demo.modelo;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "proyecto_etapa_interaccion")
public class ProyectoEtapaInteraccion {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id_interaccion")
	private Long idInteraccion;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "id_proyecto_etapa", nullable = false)
	private ProyectoEtapa proyectoEtapa;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "id_usuario_actor", nullable = false)
	private Usuario usuarioActor;

	@Column(name = "tipo_interaccion", nullable = false, length = 50)
	private String tipoInteraccion;

	@Column(name = "mensaje", nullable = false, columnDefinition = "TEXT")
	private String mensaje;

	@Column(name = "fecha_interaccion", nullable = false)
	private LocalDateTime fechaInteraccion;

	public Long getIdInteraccion() {
		return idInteraccion;
	}

	public void setIdInteraccion(Long idInteraccion) {
		this.idInteraccion = idInteraccion;
	}

	public ProyectoEtapa getProyectoEtapa() {
		return proyectoEtapa;
	}

	public void setProyectoEtapa(ProyectoEtapa proyectoEtapa) {
		this.proyectoEtapa = proyectoEtapa;
	}

	public Usuario getUsuarioActor() {
		return usuarioActor;
	}

	public void setUsuarioActor(Usuario usuarioActor) {
		this.usuarioActor = usuarioActor;
	}

	public String getTipoInteraccion() {
		return tipoInteraccion;
	}

	public void setTipoInteraccion(String tipoInteraccion) {
		this.tipoInteraccion = tipoInteraccion;
	}

	public String getMensaje() {
		return mensaje;
	}

	public void setMensaje(String mensaje) {
		this.mensaje = mensaje;
	}

	public LocalDateTime getFechaInteraccion() {
		return fechaInteraccion;
	}

	public void setFechaInteraccion(LocalDateTime fechaInteraccion) {
		this.fechaInteraccion = fechaInteraccion;
	}

}