package com.example.demo.dto;

import java.time.LocalDateTime;

import com.example.demo.modelo.ProyectoEtapa;
import com.example.demo.modelo.Usuario;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProyectoEtapaEntregaDto {

	private Long idEntrega;

	private ProyectoEtapa proyectoEtapa;

	private Usuario usuarioConstructor;

	private Integer version;

	private String nombreArchivoOriginal;

	private String extensionArchivo;

	private String providerArchivo;

	private String archivoStoragePath;

	private String archivoUrl;

	private String estadoEntrega;

	private String comentarioConstructor;

	private LocalDateTime fechaSubida;

}
