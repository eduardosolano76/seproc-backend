package com.example.demo.modelo;

import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Data
@Table(name = "etapa_plantilla")
public class EtapaPlantilla {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id_etapa_plantilla")
	private Long idEtapaPlantilla;

	// Relación recursiva: una etapa puede tener una etapa padre
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "id_etapa_padre")
	private EtapaPlantilla etapaPadre;

	// Opcional: Para navegar de padre a hijos
	@OneToMany(mappedBy = "etapaPadre", cascade = CascadeType.ALL)
	private List<EtapaPlantilla> subEtapas;

	@Column(name = "tipo_obra", length = 50)
	private String tipoObra;

	@Column(name = "clave_interna", length = 100)
	private String claveInterna;

	@Column(name = "nombre", length = 180)
	private String nombre;

	@Column(name = "descripcion", length = 500)
	private String descripcion;

	@Column(name = "orden_visual")
	private Integer ordenVisual;

	@Column(name = "nivel_arbol")
	private Integer nivelArbol;

	@Column(name = "es_contenedor")
	private Boolean esContenedor;

	@Column(name = "es_terminal")
	private Boolean esTerminal;

	@Column(name = "requiere_pdf")
	private Boolean requierePdf;

	@Column(name = "es_repetible_por_nivel")
	private Boolean esRepetiblePorNivel;

	@Column(name = "nivel_inicio_repeticion")
	private Integer nivelInicioRepeticion;

	@Column(name = "nivel_fin_repeticion")
	private Integer nivelFinRepeticion;

	@Column(name = "proyecto_niveles_min")
	private Integer proyectoNivelesMin;

	@Column(name = "proyecto_niveles_max")
	private Integer proyectoNivelesMax;

	@Column(name = "activo")
	private Boolean activo;
	
    @Column(name = "id_institucion", nullable = false)
    private String idInstitucion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_institucion", insertable = false, updatable = false)
    private Institucion institucion;

}
