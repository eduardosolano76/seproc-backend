package com.example.demo.modelo;

import jakarta.persistence.*;

@Entity
@Table(name = "cat_localidad")
public class CatLocalidad {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id_localidad")
	private Long idLocalidad;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "id_estado", nullable = false)
	private CatEstado estado;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "id_municipio", nullable = false)
	private CatMunicipio municipio;

	@Column(name = "cve_localidad", nullable = false, length = 4)
	private String cveLocalidad;

	@Column(name = "nombre", nullable = false, length = 160)
	private String nombre;

	// getters/setters
	public Long getIdLocalidad() {
		return idLocalidad;
	}

	public void setIdLocalidad(Long idLocalidad) {
		this.idLocalidad = idLocalidad;
	}

	public CatEstado getEstado() {
		return estado;
	}

	public void setEstado(CatEstado estado) {
		this.estado = estado;
	}

	public CatMunicipio getMunicipio() {
		return municipio;
	}

	public void setMunicipio(CatMunicipio municipio) {
		this.municipio = municipio;
	}

	public String getCveLocalidad() {
		return cveLocalidad;
	}

	public void setCveLocalidad(String cveLocalidad) {
		this.cveLocalidad = cveLocalidad;
	}

	public String getNombre() {
		return nombre;
	}

	public void setNombre(String nombre) {
		this.nombre = nombre;
	}

}