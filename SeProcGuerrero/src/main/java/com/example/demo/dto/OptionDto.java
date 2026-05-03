package com.example.demo.dto;

public class OptionDto {

	private Long id;

	private String nombre;

	public OptionDto() {
	}

	public OptionDto(Long id, String nombre) {
		this.id = id;
		this.nombre = nombre;
	}

	public OptionDto(Integer id, String nombre) {
		this.id = id != null ? id.longValue() : null;
		this.nombre = nombre;
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getNombre() {
		return nombre;
	}

	public void setNombre(String nombre) {
		this.nombre = nombre;
	}

}