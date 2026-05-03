package com.example.demo.modelo;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Data
@Table(name = "tipo_edificacion")
public class TipoEdificacion {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id_tipo_edificacion")
	private Integer idTipoEdificacion;

	@Column(name = "nombre", nullable = false, length = 150)
	private String nombre;

	@Column(name = "numero_niveles", nullable = false)
	private Integer numeroNiveles;

	@Column(name = "activo", nullable = false)
	private Boolean activo;

}