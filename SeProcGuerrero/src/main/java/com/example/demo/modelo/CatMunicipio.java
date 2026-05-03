package com.example.demo.modelo;

import jakarta.persistence.*;

@Entity
@Table(name = "cat_municipio")
public class CatMunicipio {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id_municipio")
	private Integer idMunicipio;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "id_estado", nullable = false)
	private CatEstado estado;

	@Column(name = "cve_municipio", nullable = false, length = 3)
	private String cveMunicipio;

	@Column(name = "nombre", nullable = false, length = 120)
	private String nombre;

	// getters/setters
	public Integer getIdMunicipio() {
		return idMunicipio;
	}

	public void setIdMunicipio(Integer idMunicipio) {
		this.idMunicipio = idMunicipio;
	}

	public CatEstado getEstado() {
		return estado;
	}

	public void setEstado(CatEstado estado) {
		this.estado = estado;
	}

	public String getCveMunicipio() {
		return cveMunicipio;
	}

	public void setCveMunicipio(String cveMunicipio) {
		this.cveMunicipio = cveMunicipio;
	}

	public String getNombre() {
		return nombre;
	}

	public void setNombre(String nombre) {
		this.nombre = nombre;
	}

}