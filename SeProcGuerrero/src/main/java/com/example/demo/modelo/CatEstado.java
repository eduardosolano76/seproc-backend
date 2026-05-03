package com.example.demo.modelo;

import jakarta.persistence.*;

@Entity
@Table(name = "cat_estado")
public class CatEstado {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id_estado")
	private Integer idEstado;

	@Column(name = "cve_estado", nullable = false, length = 2)
	private String cveEstado;

	@Column(name = "nombre", nullable = false, length = 80)
	private String nombre;

	// getters/setters
	public Integer getIdEstado() {
		return idEstado;
	}

	public void setIdEstado(Integer idEstado) {
		this.idEstado = idEstado;
	}

	public String getCveEstado() {
		return cveEstado;
	}

	public void setCveEstado(String cveEstado) {
		this.cveEstado = cveEstado;
	}

	public String getNombre() {
		return nombre;
	}

	public void setNombre(String nombre) {
		this.nombre = nombre;
	}

}