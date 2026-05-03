package com.example.demo.modelo;

import java.time.LocalDateTime;

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
@Table(name = "proyecto_etapa_entrega")
public class ProyectoEtapaEntrega {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id_entrega")
	private Long idEntrega;

	// Relación con la tabla proyecto_etapa
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "id_proyecto_etapa")
	private ProyectoEtapa proyectoEtapa;

	// Relación con la tabla usuario (el constructor que sube el archivo)
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "id_usuario_constructor")
	private Usuario usuarioConstructor;

	@Column(name = "version")
	private Integer version;

	@Column(name = "nombre_archivo_original", columnDefinition = "TEXT")
	private String nombreArchivoOriginal;

	@Column(name = "extension_archivo", length = 10)
	private String extensionArchivo;

	@Column(name = "provider_archivo")
	private String providerArchivo; // Se mapea al ENUM de BD (ej. "FIREBASE")

	@Column(name = "archivo_storage_path", columnDefinition = "TEXT")
	private String archivoStoragePath;

	@Column(name = "archivo_url", columnDefinition = "TEXT")
	private String archivoUrl;

	@Column(name = "estado_entrega")
	private String estadoEntrega; // Se mapea al ENUM de BD (ej. "ENTREGADO",
									// "EN_REVISION")

	@Column(name = "comentario_constructor", columnDefinition = "TEXT")
	private String comentarioConstructor;

	@Column(name = "fecha_subida")
	private LocalDateTime fechaSubida;

}
