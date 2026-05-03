package com.example.demo.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UsuarioUpsertDto {

	private String nombre;

	private String apellido;

	private String username;

	private String email;

	private String password; // opcional en update, obligatorio en create

	private String rolNombre; // opcional (si quieres cambiar rol desde modal)

}
