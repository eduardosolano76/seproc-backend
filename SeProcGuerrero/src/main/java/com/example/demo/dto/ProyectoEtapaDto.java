package com.example.demo.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.example.demo.modelo.EtapaPlantilla;
import com.example.demo.modelo.Proyecto;
import com.example.demo.modelo.ProyectoEtapa;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProyectoEtapaDto {

	private Long idProyectoEtapa;

	private Proyecto proyecto;

	private ProyectoEtapa proyectoEtapaPadre;

	private EtapaPlantilla etapaPlantilla;

	private String nombreMostrado;

	private Integer numeroNivel;

	private Integer ordenVisual;

	private Integer nivelArbol;

	private String estado;

	private BigDecimal avancePorcentaje;

	private LocalDateTime fechaHabilitada;

	private LocalDateTime fechaInicio;

	private LocalDateTime fechaCierre;

	private LocalDateTime fechaActualizacion;

	private String claveInterna;

}
