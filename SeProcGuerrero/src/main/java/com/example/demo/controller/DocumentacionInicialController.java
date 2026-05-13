package com.example.demo.controller;

import java.util.Map;


import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.modelo.Proyecto;
import com.example.demo.modelo.Usuario;
import com.example.demo.modelo.SolicitudProyecto;
import com.example.demo.repository.ProyectoRepository;
import com.example.demo.repository.SolicitudProyectoRepository;
import com.example.demo.repository.UsuarioRepository;
import com.example.demo.service.DocumentoInicialService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api")
public class DocumentacionInicialController {

    private final DocumentoInicialService documentoInicialService;
    private final ProyectoRepository proyectoRepo;
    private final SolicitudProyectoRepository solicitudRepo;
    private final UsuarioRepository usuarioRepo;

    public DocumentacionInicialController(
            DocumentoInicialService documentoInicialService,
            ProyectoRepository proyectoRepo,
            SolicitudProyectoRepository solicitudRepo,
            UsuarioRepository usuarioRepo) {
        this.documentoInicialService = documentoInicialService;
        this.proyectoRepo = proyectoRepo;
        this.solicitudRepo = solicitudRepo;
        this.usuarioRepo = usuarioRepo;
    }

    @GetMapping({
            "/constructor/proyectos/{idProyecto}/documentacion-inicial",
            "/supervisor/proyectos/{idProyecto}/documentacion-inicial",
            "/central/proyectos/{idProyecto}/documentacion-inicial",
            "/admin/proyectos/{idProyecto}/documentacion-inicial",
            "/direccion/proyectos/{idProyecto}/documentacion-inicial"
    })
    public ResponseEntity<?> obtenerDocumentacionProyecto(
            @PathVariable Integer idProyecto,
            Authentication auth,
            HttpServletRequest request) {

        Usuario usuario = usuarioActual(auth);

        Proyecto proyecto = proyectoRepo.findById(idProyecto)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Proyecto no encontrado."
                ));

        validarAccesoProyecto(proyecto, usuario, request.getRequestURI());

        return ResponseEntity.ok(documentoInicialService.obtenerPorProyecto(idProyecto));
    }
    
    @GetMapping({
        "/constructor/solicitudes/{idSolicitud}/documentacion-inicial",
        "/central/solicitudes/{idSolicitud}/documentacion-inicial",
        "/admin/solicitudes/{idSolicitud}/documentacion-inicial"
})
public ResponseEntity<?> obtenerDocumentacionSolicitud(
        @PathVariable Integer idSolicitud,
        Authentication auth,
        HttpServletRequest request) {

    Usuario usuario = usuarioActual(auth);

    SolicitudProyecto solicitud = solicitudRepo.findById(idSolicitud)
            .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Solicitud no encontrada."
            ));

    validarAccesoSolicitud(solicitud, usuario, request.getRequestURI());

    return ResponseEntity.ok(documentoInicialService.obtenerPorSolicitud(idSolicitud));
}

    @PostMapping(
            value = "/constructor/solicitudes/{idSolicitud}/documentos/{tipoDocumento}",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<?> subirDocumentoSolicitud(
            @PathVariable Integer idSolicitud,
            @PathVariable String tipoDocumento,
            @RequestParam("file") MultipartFile file,
            Authentication auth) {

        Usuario usuario = usuarioActual(auth);

        var solicitud = solicitudRepo.findById(idSolicitud)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Solicitud no encontrada."
                ));

        if (!usuario.getIdUsuario().equals(solicitud.getIdUsuarioContratista())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "No tienes acceso a esta solicitud."));
        }

        return ResponseEntity.ok(
                documentoInicialService.subirDocumento(idSolicitud, tipoDocumento, usuario, file)
        );
    }

    private Usuario usuarioActual(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no autenticado.");
        }

        return usuarioRepo.findByUsername(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Usuario no encontrado."
                ));
    }

    private void validarAccesoProyecto(Proyecto proyecto, Usuario usuario, String uri) {
        if (uri.contains("/constructor/")) {
            Long idConstructor = proyecto.getSolicitud().getIdUsuarioContratista();

            if (!usuario.getIdUsuario().equals(idConstructor)) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "No tienes acceso a este proyecto."
                );
            }
        }

        if (uri.contains("/supervisor/")) {
            if (!usuario.getIdUsuario().equals(proyecto.getIdUsuarioSupervisor())) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "No tienes acceso a este proyecto."
                );
            }
        }

    }
    
    private void validarAccesoSolicitud(SolicitudProyecto solicitud, Usuario usuario, String uri) {
        if (uri.contains("/constructor/")) {
            if (!usuario.getIdUsuario().equals(solicitud.getIdUsuarioContratista())) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "No tienes acceso a esta solicitud."
                );
            }
        }

    }
    
    
}