package com.example.demo.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegistroDto {

	@NotBlank
	@Size(min = 3, max = 50)
	private String username;

	@NotBlank
	@Size(min = 4, max = 100)
	private String password;

	@NotBlank
	@Size(max = 250)
	private String nombre;

	@NotBlank
	@Size(max = 250)
	private String apellido;

	@NotBlank
	@Email
	@Size(max = 100)
	private String email;

}
