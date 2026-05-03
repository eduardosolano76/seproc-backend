package com.example.demo.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CambiarPasswordDto {

	private String passActual;

	private String passNueva;

	private String passRepetida;

}
