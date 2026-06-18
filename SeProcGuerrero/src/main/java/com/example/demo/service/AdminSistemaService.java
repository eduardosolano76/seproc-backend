package com.example.demo.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.modelo.EstadoSolicitud;
import com.example.demo.modelo.Institucion;
import com.example.demo.modelo.Rol;
import com.example.demo.modelo.SolicitudInstitucion;
import com.example.demo.modelo.Usuario;
import com.example.demo.repository.InstitucionRepository;
import com.example.demo.repository.RolRepository;
import com.example.demo.repository.SolicitudInstitucionRepository;
import com.example.demo.repository.UsuarioRepository;

@Service
public class AdminSistemaService {

    private final SolicitudInstitucionRepository solicitudRepo;
    private final InstitucionRepository institucionRepo;
    private final UsuarioRepository usuarioRepo;
    private final RolRepository rolRepo;
    private final PasswordEncoder passwordEncoder;
    private final InstitucionSchemaNameService schemaNameService;
    private final InstitucionProvisioningService provisioningService;

    public AdminSistemaService(
            SolicitudInstitucionRepository solicitudRepo,
            InstitucionRepository institucionRepo,
            UsuarioRepository usuarioRepo,
            RolRepository rolRepo,
            PasswordEncoder passwordEncoder,
            InstitucionSchemaNameService schemaNameService,
            InstitucionProvisioningService provisioningService
    ) {
        this.solicitudRepo = solicitudRepo;
        this.institucionRepo = institucionRepo;
        this.usuarioRepo = usuarioRepo;
        this.rolRepo = rolRepo;
        this.passwordEncoder = passwordEncoder;
        this.schemaNameService = schemaNameService;
        this.provisioningService = provisioningService;
    }

    public List<SolicitudInstitucion> obtenerSolicitudesPendientes() {
        return solicitudRepo.findAll().stream()
                .filter(s -> s.getEstado() == EstadoSolicitud.PENDIENTE)
                .toList();
    }

    @Transactional
    public void aprobarSolicitud(Integer idSolicitud) {
        SolicitudInstitucion sol = solicitudRepo.findById(idSolicitud)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Solicitud no encontrada"
                ));

        if (sol.getEstado() != EstadoSolicitud.PENDIENTE) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La solicitud ya fue procesada anteriormente."
            );
        }

        String abreviacion = obtenerAbreviacionValida(sol, idSolicitud);

        if (institucionRepo.existsByAbreviacionIgnoreCase(abreviacion)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Ya existe una institución registrada con la abreviación: " + abreviacion
            );
        }

        String schemaName = schemaNameService.generarSchemaDesdeAbreviacion(abreviacion);

        if (institucionRepo.existsBySchemaName(schemaName)) {
            schemaName = schemaName + "_" + idSolicitud;
        }

        provisioningService.crearTenantInstitucion(schemaName);

        Institucion nuevaInst = new Institucion();
        nuevaInst.setIdInstitucion(UUID.randomUUID().toString());
        nuevaInst.setNombreOficial(sol.getNombreDependencia());
        nuevaInst.setAbreviacion(abreviacion);
        nuevaInst.setCorreo(sol.getEmailContacto());
        nuevaInst.setTelefono(sol.getTelefonoContacto());
        nuevaInst.setActiva(1);
        nuevaInst.setSchemaName(schemaName);

        institucionRepo.save(nuevaInst);

        Usuario adminTenant = crearUsuarioAdministrador(sol, nuevaInst, idSolicitud);

        usuarioRepo.save(adminTenant);

        sol.setEstado(EstadoSolicitud.APROBADA);
        sol.setFechaResolucion(LocalDateTime.now());

        solicitudRepo.save(sol);
    }

    @Transactional
    public void rechazarSolicitud(Integer idSolicitud) {
        SolicitudInstitucion sol = solicitudRepo.findById(idSolicitud)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Solicitud no encontrada"
                ));

        if (sol.getEstado() != EstadoSolicitud.PENDIENTE) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La solicitud ya fue procesada anteriormente."
            );
        }

        sol.setEstado(EstadoSolicitud.RECHAZADA);
        sol.setFechaResolucion(LocalDateTime.now());

        solicitudRepo.save(sol);
    }

    private String obtenerAbreviacionValida(SolicitudInstitucion sol, Integer idSolicitud) {
        String abreviacion = sol.getAbreviacion();

        if (abreviacion == null || abreviacion.isBlank()) {
            return "INST-" + idSolicitud;
        }

        return abreviacion.trim().toUpperCase();
    }

    private Usuario crearUsuarioAdministrador(
            SolicitudInstitucion sol,
            Institucion institucion,
            Integer idSolicitud
    ) {
        Usuario usuario = new Usuario();

        usuario.setInstitucion(institucion);

        String nombreContacto = sol.getNombreContacto();
        String nombre = nombreContacto;
        String apellido = "Admin";

        if (nombreContacto != null && nombreContacto.trim().contains(" ")) {
            String limpio = nombreContacto.trim();
            int lastSpace = limpio.lastIndexOf(" ");

            nombre = limpio.substring(0, lastSpace);
            apellido = limpio.substring(lastSpace + 1);
        }

        usuario.setNombre(nombre);
        usuario.setApellido(apellido);
        
        if (usuarioRepo.existsByEmail(sol.getEmailContacto())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Ya existe un usuario registrado con el correo: " + sol.getEmailContacto()
            );
        }
        
        usuario.setEmail(sol.getEmailContacto());

        String username = generarUsername(sol.getEmailContacto(), idSolicitud);

        usuario.setUsername(username);
        usuario.setPassword(passwordEncoder.encode("12345"));
        usuario.setFechaRegistro(LocalDate.now());
        usuario.setActivo(true);

        Rol rolAdmin = rolRepo.findByNombre("administrador")
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.INTERNAL_SERVER_ERROR,
                        "El rol 'administrador' no existe en la base de datos."
                ));

        usuario.setRol(rolAdmin);

        return usuario;
    }

    private String generarUsername(String email, Integer idSolicitud) {
        String username = "admin_inst_" + idSolicitud;

        if (email != null && email.contains("@")) {
            username = email.substring(0, email.indexOf("@"));
        }

        username = username.trim().toLowerCase();

        if (usuarioRepo.existsByUsername(username)) {
            username = username + "_" + idSolicitud;
        }

        return username;
    }
}