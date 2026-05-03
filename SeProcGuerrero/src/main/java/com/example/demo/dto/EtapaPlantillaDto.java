package com.example.demo.dto;

import java.util.List;

import com.example.demo.modelo.EtapaPlantilla;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EtapaPlantillaDto {

	private Long idEtapaPlantilla;

	private EtapaPlantilla etapaPadre;

	private List<EtapaPlantilla> subEtapas;

	private String tipoObra;

	private String claveInterna;

	private String nombre;

	private String descripcion;

	private Integer ordenVisual;

	private Integer nivelArbol;

	private Boolean esContenedor;

	private Boolean esTerminal;

	private Boolean requierePdf;

	private Boolean esRepetiblePorNivel;

	private Integer nivelInicioRepeticion;

	private Integer nivelFinRepeticion;

	private Integer proyectoNivelesMin;

	private Integer proyectoNivelesMax;

	private Boolean activo;

}
