package com.example.demo.modelo;

import java.time.LocalDate;

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
@Table(name = "usuario")
public class Usuario {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id_usuario")
	private Long idUsuario;

	// FK a roles(id_roles)
	@ManyToOne(fetch = FetchType.EAGER)
	@JoinColumn(name = "id_roles")
	private Rol rol;

	@Column(name = "nombre", nullable = false, length = 250)
	private String nombre;

	@Column(name = "apellido", nullable = false, length = 250)
	private String apellido;

	@Column(name = "password", nullable = false, length = 100)
	private String password;

	@Column(name = "username", length = 50)
	private String username;

	@Column(name = "email", nullable = false, unique = true, length = 100)
	private String email;

	@Column(name = "fechaRegistro")
	private LocalDate fechaRegistro;

	@Column(name = "activo", nullable = false)
	private Boolean activo = false;

	@Column(name = "foto", length = 255, nullable = true)
	private String foto; // guarda la "key" tipo: usuarios/15/profile_xxx.jpg
	
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_institucion", insertable = false, updatable = false)
    private Institucion institucion;

}
