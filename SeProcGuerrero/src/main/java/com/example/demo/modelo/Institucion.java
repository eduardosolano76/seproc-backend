package com.example.demo.modelo;

import jakarta.persistence.Id;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Data
@Table(name = "institucion")
public class Institucion {

	@Id
	@Column(name = "id_institucion", columnDefinition = "CHAR(36)")
	private String idInstitucion;

	@Column(name = "nombre_oficial", nullable = false, length = 200)
	private String nombreOficial;

	@Column(name = "abreviacion", nullable = false, unique = true, length = 50)
	private String abreviacion;

	@Column(name = "logo_url")
	private String logoUrl;

	private String correo;

	private String telefono;

	@Column(columnDefinition = "TINYINT DEFAULT 1")
	private Integer activa;

}
