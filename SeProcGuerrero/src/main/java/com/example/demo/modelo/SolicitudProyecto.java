package com.example.demo.modelo;

import java.time.LocalDateTime;

import org.hibernate.annotations.TenantId;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Data
@Table(name = "solicitud_proyecto")
public class SolicitudProyecto {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id_solicitud")
	private Integer idSolicitud;

	@Column(name = "id_usuario_contratista", nullable = false)
	private Long idUsuarioContratista;

	@Column(name = "id_usuario_central")
	private Long idUsuarioCentral;

	@Column(name = "estado_solicitud", nullable = false)
	private String estadoSolicitud;

	@Column(name = "motivo_rechazo", length = 500)
	private String motivoRechazo;

	@Column(name = "fecha_solicitud", nullable = false)
	private LocalDateTime fechaSolicitud;

	@Column(name = "fecha_resolucion")
	private LocalDateTime fechaResolucion;

	@Column(name = "nombre_escuela", nullable = false, length = 200)
	private String nombreEscuela;

	@Column(name = "cct1", nullable = false, length = 20)
	private String cct1;

	@Column(name = "cct2", length = 20)
	private String cct2;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "id_estado", nullable = false)
	private CatEstado estado;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "id_municipio", nullable = false)
	private CatMunicipio municipio;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "id_localidad", nullable = false)
	private CatLocalidad localidad;

	@Column(name = "calle_numero", nullable = false, length = 200)
	private String calleNumero;

	@Column(name = "cp", nullable = false, length = 10)
	private String cp;

	@Column(name = "responsable_inmueble", nullable = false, length = 150)
	private String responsableInmueble;

	@Column(name = "contacto", nullable = false, length = 150)
	private String contacto;

	@Column(name = "num_inmuebles_evaluar", nullable = false)
	private Integer numInmueblesEvaluar;

	@Column(name = "num_entre_ejes", nullable = false)
	private Integer numEntreEjes;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "id_tipo_edificacion", nullable = false)
	private TipoEdificacion tipoEdificacion;

	@Column(name = "tipo_obra", nullable = false, length = 100)
	private String tipoObra;

	@PrePersist
	void prePersist() {
		if (fechaSolicitud == null) {
			fechaSolicitud = LocalDateTime.now();
		}
		if (estadoSolicitud == null || estadoSolicitud.isBlank()) {
			estadoSolicitud = "PENDIENTE";
		}
	}

	@TenantId
    @Column(name = "id_institucion", nullable = false)
    private String idInstitucionTenant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_institucion", insertable = false, updatable = false)
    private Institucion institucion;

}