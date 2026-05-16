package com.example.demo.modelo;

import java.time.LocalDateTime;


import org.hibernate.annotations.TenantId;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Data
@Table(name = "solicitud_proyecto_documento")
public class SolicitudProyectoDocumento {

    public static final String TIPO_LICENCIA_CONSTRUCCION = "LICENCIA_CONSTRUCCION";
    public static final String TIPO_MECANICA_SUELOS = "MECANICA_SUELOS";
    public static final String TIPO_ESTUDIO_AMBIENTAL = "ESTUDIO_AMBIENTAL";

    public static final String ESTADO_PENDIENTE = "PENDIENTE";
    public static final String ESTADO_SUBIDO = "SUBIDO";
    public static final String ESTADO_REQUIERE_CORRECCION = "REQUIERE_CORRECCION";
    public static final String ESTADO_APROBADO = "APROBADO";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_documento")
    private Long idDocumento;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_solicitud", nullable = false)
    private SolicitudProyecto solicitud;

    @Column(name = "tipo_documento", nullable = false, length = 40)
    private String tipoDocumento;

    @Column(name = "estado_documento", nullable = false, length = 20)
    private String estadoDocumento;

    @Column(name = "nombre_archivo_original", columnDefinition = "TEXT")
    private String nombreArchivoOriginal;

    @Column(name = "extension_archivo", length = 10)
    private String extensionArchivo;

    @Column(name = "provider_archivo", length = 30)
    private String providerArchivo;

    @Column(name = "archivo_storage_path", columnDefinition = "TEXT")
    private String archivoStoragePath;

    @Column(name = "archivo_url", columnDefinition = "TEXT")
    private String archivoUrl;

    @Column(name = "fecha_limite", nullable = false)
    private LocalDateTime fechaLimite;

    @Column(name = "fecha_subida")
    private LocalDateTime fechaSubida;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario_subio")
    private Usuario usuarioSubio;
    
    @Column(name = "motivo_correccion", columnDefinition = "TEXT")
    private String motivoCorreccion;

    @Column(name = "fecha_correccion")
    private LocalDateTime fechaCorreccion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario_solicito_correccion")
    private Usuario usuarioSolicitoCorreccion;

    @TenantId
    @Column(name = "id_institucion", nullable = false)
    private String idInstitucionTenant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_institucion", insertable = false, updatable = false)
    private Institucion institucion;

    @PrePersist
    void prePersist() {
        if (fechaCreacion == null) {
            fechaCreacion = LocalDateTime.now();
        }
        if (estadoDocumento == null || estadoDocumento.isBlank()) {
            estadoDocumento = ESTADO_PENDIENTE;
        }
    }
}