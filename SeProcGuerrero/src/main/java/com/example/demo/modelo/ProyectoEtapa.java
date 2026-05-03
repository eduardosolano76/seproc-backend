package com.example.demo.modelo;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Data
@Table(name = "proyecto_etapa")
public class ProyectoEtapa {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id_proyecto_etapa")
	private Long idProyectoEtapa;

	// Relación con el Proyecto (tu tabla principal de la obra)
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "id_proyecto")
	private Proyecto proyecto;

	// Si existe una etapa padre (para sub-etapas como "Muros" dentro de "Estructura")
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "id_proyecto_etapa_padre")
	private ProyectoEtapa proyectoEtapaPadre;

	// Relación con el catálogo de etapas (ej. "Excavación", "Cimentación")
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "id_etapa_plantilla")
	private EtapaPlantilla etapaPlantilla;

	@Column(name = "nombre_mostrado", length = 200)
	private String nombreMostrado;

	@Column(name = "numero_nivel")
	private Integer numeroNivel;

	@Column(name = "orden_visual")
	private Integer ordenVisual;

	@Column(name = "nivel_arbol")
	private Integer nivelArbol;

	@Column(name = "estado")
	private String estado; // Se mapea al ENUM (ej. 'PENDIENTE', 'EN_PROCESO',
							// 'COMPLETADO')

	@Column(name = "avance_porcentaje", precision = 5, scale = 2)
	private BigDecimal avancePorcentaje;

	@Column(name = "fecha_habilitada")
	private LocalDateTime fechaHabilitada;

	@Column(name = "fecha_inicio")
	private LocalDateTime fechaInicio;

	@Column(name = "fecha_cierre")
	private LocalDateTime fechaCierre;

	@Column(name = "fecha_actualizacion")
	private LocalDateTime fechaActualizacion;

}
