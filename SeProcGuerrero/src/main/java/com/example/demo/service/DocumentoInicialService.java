package com.example.demo.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.modelo.Proyecto;
import com.example.demo.modelo.SolicitudProyecto;
import com.example.demo.modelo.SolicitudProyectoDocumento;
import com.example.demo.modelo.Usuario;
import com.example.demo.repository.ProyectoRepository;
import com.example.demo.repository.SolicitudProyectoDocumentoRepository;
import com.example.demo.repository.SolicitudProyectoRepository;
import com.example.demo.storage.StorageService;
import java.util.LinkedHashMap;

@Service
@Transactional
public class DocumentoInicialService {

    private final SolicitudProyectoDocumentoRepository documentoRepo;
    private final SolicitudProyectoRepository solicitudRepo;
    private final ProyectoRepository proyectoRepo;
    private final StorageService storageService;

    public DocumentoInicialService(SolicitudProyectoDocumentoRepository documentoRepo,
            SolicitudProyectoRepository solicitudRepo,
            ProyectoRepository proyectoRepo,
            StorageService storageService) {
        this.documentoRepo = documentoRepo;
        this.solicitudRepo = solicitudRepo;
        this.proyectoRepo = proyectoRepo;
        this.storageService = storageService;
    }

    public void crearPendientesSiNoExisten(SolicitudProyecto solicitud) {
        crearSiNoExiste(solicitud, SolicitudProyectoDocumento.TIPO_LICENCIA_CONSTRUCCION);
        crearSiNoExiste(solicitud, SolicitudProyectoDocumento.TIPO_MECANICA_SUELOS);
        crearSiNoExiste(solicitud, SolicitudProyectoDocumento.TIPO_ESTUDIO_AMBIENTAL);
    }

    private void crearSiNoExiste(SolicitudProyecto solicitud, String tipoDocumento) {
        boolean existe = documentoRepo.existsBySolicitud_IdSolicitudAndTipoDocumento(
                solicitud.getIdSolicitud(),
                tipoDocumento
        );

        if (existe) {
            return;
        }

        SolicitudProyectoDocumento doc = new SolicitudProyectoDocumento();
        doc.setSolicitud(solicitud);
        doc.setTipoDocumento(tipoDocumento);
        doc.setEstadoDocumento(SolicitudProyectoDocumento.ESTADO_PENDIENTE);

        LocalDateTime fechaBase = solicitud.getFechaSolicitud() != null
                ? solicitud.getFechaSolicitud()
                : LocalDateTime.now();

        doc.setFechaLimite(fechaBase.plusMonths(1));

        if (solicitud.getInstitucion() != null) {
            doc.setIdInstitucionTenant(solicitud.getInstitucion().getIdInstitucion());
        }

        documentoRepo.save(doc);
    }

    public Map<String, Object> obtenerPorProyecto(Integer idProyecto) {
        Proyecto proyecto = proyectoRepo.findById(idProyecto)
                .orElseThrow(() -> new IllegalArgumentException("Proyecto no encontrado."));

        return obtenerPorSolicitud(proyecto.getSolicitud());
    }

    public Map<String, Object> obtenerPorSolicitud(Integer idSolicitud) {
        SolicitudProyecto solicitud = solicitudRepo.findById(idSolicitud)
                .orElseThrow(() -> new IllegalArgumentException("Solicitud no encontrada."));

        return obtenerPorSolicitud(solicitud);
    }

    private Map<String, Object> obtenerPorSolicitud(SolicitudProyecto solicitud) {
        crearPendientesSiNoExisten(solicitud);

        List<SolicitudProyectoDocumento> documentos =
                documentoRepo.findBySolicitud_IdSolicitudOrderByIdDocumentoAsc(solicitud.getIdSolicitud());

        LocalDateTime ahora = LocalDateTime.now();

        List<Map<String, Object>> items = documentos.stream().map(doc -> {
        	boolean subido = SolicitudProyectoDocumento.ESTADO_SUBIDO
        	        .equalsIgnoreCase(doc.getEstadoDocumento());

        	boolean requiereCorreccion = SolicitudProyectoDocumento.ESTADO_REQUIERE_CORRECCION
        	        .equalsIgnoreCase(doc.getEstadoDocumento());

        	boolean aprobado = SolicitudProyectoDocumento.ESTADO_APROBADO
        	        .equalsIgnoreCase(doc.getEstadoDocumento());

        	boolean tieneArchivo = doc.getArchivoStoragePath() != null
        	        && !doc.getArchivoStoragePath().isBlank();

        	boolean pendiente = !subido && !aprobado;

            boolean vencido = pendiente
                    && doc.getFechaLimite() != null
                    && ahora.isAfter(doc.getFechaLimite());

            Map<String, Object> item = new LinkedHashMap<>();

            item.put("idDocumento", doc.getIdDocumento());
            item.put("tipoDocumento", doc.getTipoDocumento());
            item.put("nombreDocumento", nombreVisible(doc.getTipoDocumento()));
            item.put("estadoDocumento", doc.getEstadoDocumento());

            item.put("subido", subido);
            item.put("pendiente", pendiente);
            item.put("requiereCorreccion", requiereCorreccion);
            item.put("aprobado", aprobado);
            item.put("tieneArchivo", tieneArchivo);
            item.put("vencido", vencido);

            item.put("fechaLimite", formatearFecha(doc.getFechaLimite()));
            item.put("fechaSubida", formatearFecha(doc.getFechaSubida()));
            item.put("fechaCorreccion", formatearFecha(doc.getFechaCorreccion()));

            item.put("motivoCorreccion",
                    doc.getMotivoCorreccion() != null ? doc.getMotivoCorreccion() : "");

            item.put("nombreArchivoOriginal",
                    doc.getNombreArchivoOriginal() != null ? doc.getNombreArchivoOriginal() : "");

            item.put("archivoUrl", storageService.publicUrl(doc.getArchivoStoragePath()));

            return item;
        }).toList();

        long pendientes = documentos.stream()
                .filter(d -> !documentoCompleto(d))
                .count();

        boolean vencido = documentos.stream()
                .anyMatch(d -> !documentoCompleto(d)
                        && d.getFechaLimite() != null
                        && ahora.isAfter(d.getFechaLimite()));

        return Map.of(
                "idSolicitud", solicitud.getIdSolicitud(),
                "total", documentos.size(),
                "pendientes", pendientes,
                "completo", pendientes == 0,
                "vencido", vencido,
                "mensaje", construirMensaje(pendientes, vencido),
                "documentos", items
        );
    }

    public Map<String, Object> subirDocumento(Integer idSolicitud, String tipoDocumento,
            Usuario usuario, MultipartFile file) {

        SolicitudProyecto solicitud = solicitudRepo.findById(idSolicitud)
                .orElseThrow(() -> new IllegalArgumentException("Solicitud no encontrada."));

        crearPendientesSiNoExisten(solicitud);

        String tipoNormalizado = normalizarTipo(tipoDocumento);

        SolicitudProyectoDocumento doc = documentoRepo
                .findBySolicitud_IdSolicitudAndTipoDocumento(idSolicitud, tipoNormalizado)
                .orElseThrow(() -> new IllegalArgumentException("Documento no encontrado."));

        if (doc.getArchivoStoragePath() != null && !doc.getArchivoStoragePath().isBlank()) {
            storageService.deleteIfExists(doc.getArchivoStoragePath());
        }

        String key = storageService.saveDocumentoInicialPdf(
                usuario.getIdUsuario(),
                usuario.getUsername(),
                idSolicitud,
                tipoNormalizado,
                file
        );

        doc.setNombreArchivoOriginal(file.getOriginalFilename());
        doc.setExtensionArchivo("pdf");
        doc.setProviderArchivo("FIREBASE");
        doc.setArchivoStoragePath(key);
        doc.setArchivoUrl(storageService.publicUrl(key));
        doc.setEstadoDocumento(SolicitudProyectoDocumento.ESTADO_SUBIDO);
        doc.setMotivoCorreccion(null);
        doc.setFechaCorreccion(null);
        doc.setUsuarioSolicitoCorreccion(null);

        // Si el documento estaba en corrección, se limpia al volver a subirlo
        doc.setMotivoCorreccion(null);
        doc.setFechaCorreccion(null);
        doc.setUsuarioSolicitoCorreccion(null);

        documentoRepo.save(doc);

        return obtenerPorSolicitud(solicitud);
    }

    public String normalizarTipo(String tipoDocumento) {
        if (tipoDocumento == null) {
            throw new IllegalArgumentException("Tipo de documento requerido.");
        }

        String tipo = tipoDocumento.trim().toUpperCase();

        return switch (tipo) {
            case SolicitudProyectoDocumento.TIPO_LICENCIA_CONSTRUCCION -> tipo;
            case SolicitudProyectoDocumento.TIPO_MECANICA_SUELOS -> tipo;
            case SolicitudProyectoDocumento.TIPO_ESTUDIO_AMBIENTAL -> tipo;
            default -> throw new IllegalArgumentException("Tipo de documento no válido.");
        };
    }

    private String nombreVisible(String tipoDocumento) {
        return switch (tipoDocumento) {
            case SolicitudProyectoDocumento.TIPO_LICENCIA_CONSTRUCCION -> "Licencia de construcción";
            case SolicitudProyectoDocumento.TIPO_MECANICA_SUELOS -> "Mecánica de suelos";
            case SolicitudProyectoDocumento.TIPO_ESTUDIO_AMBIENTAL -> "Estudio ambiental";
            default -> tipoDocumento;
        };
    }

    private String formatearFecha(LocalDateTime fecha) {
        if (fecha == null) {
            return "";
        }
        return fecha.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
    }

    private String construirMensaje(long pendientes, boolean vencido) {
        if (pendientes == 0) {
            return "Documentación inicial completa.";
        }

        if (vencido) {
            return "Documentación inicial pendiente vencida.";
        }

        return "Documentación inicial pendiente de aprobación o corrección.";
    }
    
    public Map<String, Object> solicitarCorreccion(Long idDocumento, Usuario usuario, String motivo) {
        SolicitudProyectoDocumento doc = documentoRepo.findById(idDocumento)
                .orElseThrow(() -> new IllegalArgumentException("Documento no encontrado."));

        if (doc.getArchivoStoragePath() == null || doc.getArchivoStoragePath().isBlank()) {
            throw new IllegalArgumentException("No se puede solicitar corrección de un documento que aún no se ha subido.");
        }

        if (motivo == null || motivo.trim().isBlank()) {
            throw new IllegalArgumentException("Debes escribir el motivo de la corrección.");
        }

        doc.setEstadoDocumento(SolicitudProyectoDocumento.ESTADO_REQUIERE_CORRECCION);
        doc.setMotivoCorreccion(motivo.trim());
        doc.setFechaCorreccion(LocalDateTime.now());
        doc.setFechaActualizacion(LocalDateTime.now());
        doc.setUsuarioSolicitoCorreccion(usuario);

        documentoRepo.save(doc);

        return obtenerPorSolicitud(doc.getSolicitud());
    }
    
    public Map<String, Object> aprobarDocumento(Long idDocumento, Usuario usuario) {
        SolicitudProyectoDocumento doc = documentoRepo.findById(idDocumento)
                .orElseThrow(() -> new IllegalArgumentException("Documento no encontrado."));

        if (doc.getArchivoStoragePath() == null || doc.getArchivoStoragePath().isBlank()) {
            throw new IllegalArgumentException("No se puede aprobar un documento que aún no se ha subido.");
        }

        doc.setEstadoDocumento(SolicitudProyectoDocumento.ESTADO_APROBADO);
        doc.setMotivoCorreccion(null);
        doc.setFechaCorreccion(null);
        doc.setUsuarioSolicitoCorreccion(null);
        doc.setFechaActualizacion(LocalDateTime.now());

        documentoRepo.save(doc);

        return obtenerPorSolicitud(doc.getSolicitud());
    }
    
    private boolean documentoCompleto(SolicitudProyectoDocumento doc) {
        return SolicitudProyectoDocumento.ESTADO_APROBADO.equalsIgnoreCase(doc.getEstadoDocumento());
    }
}