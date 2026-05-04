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

    // Inyección de dependencias
    public AdminSistemaService(SolicitudInstitucionRepository solicitudRepo, InstitucionRepository institucionRepo,
                               UsuarioRepository usuarioRepo, RolRepository rolRepo, PasswordEncoder passwordEncoder) {
        this.solicitudRepo = solicitudRepo;
        this.institucionRepo = institucionRepo;
        this.usuarioRepo = usuarioRepo;
        this.rolRepo = rolRepo;
        this.passwordEncoder = passwordEncoder;
    }

    // Obtener solo las solicitudes que están en estado PENDIENTE
    public List<SolicitudInstitucion> obtenerSolicitudesPendientes() {
        return solicitudRepo.findAll().stream()
                .filter(s -> s.getEstado() == EstadoSolicitud.PENDIENTE)
                .toList();
    }

    // Lógica para APROBAR una solicitud (Crea el Tenant y el primer Usuario)
    @Transactional
    public void aprobarSolicitud(Integer idSolicitud) {
        SolicitudInstitucion sol = solicitudRepo.findById(idSolicitud)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Solicitud no encontrada"));

        if (sol.getEstado() != EstadoSolicitud.PENDIENTE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La solicitud ya fue procesada anteriormente.");
        }

        // Marcar solicitud como aprobada ---
        sol.setEstado(EstadoSolicitud.APROBADA);
        sol.setFechaResolucion(LocalDateTime.now());
        solicitudRepo.save(sol);

        // Crear la nueva Institución (Tenant) ---
        Institucion nuevaInst = new Institucion();
        nuevaInst.setIdInstitucion(UUID.randomUUID().toString()); // UUID aleatorio de 36 caracteres
        nuevaInst.setNombreOficial(sol.getNombreDependencia());
        
        // Asignar abreviación (si no pusieron, le ponemos "N/A" para que no truene el unique constraint)
        String abreviacion = (sol.getAbreviacion() != null && !sol.getAbreviacion().isBlank()) ? sol.getAbreviacion() : "N/A-" + idSolicitud;
        nuevaInst.setAbreviacion(abreviacion);
        
        nuevaInst.setCorreo(sol.getEmailContacto());
        nuevaInst.setTelefono(sol.getTelefonoContacto());
        nuevaInst.setActiva(1);
        institucionRepo.save(nuevaInst);

        // Crear el primer usuario (Administrador del Tenant) ---
        Usuario adminTenant = new Usuario();
        adminTenant.setInstitucion(nuevaInst);
        
        // Tratar de separar el nombre del contacto en Nombre y Apellido (ej. "Juan Perez")
        String nombreContacto = sol.getNombreContacto();
        String nombre = nombreContacto;
        String apellido = "Admin"; // Por defecto
        
        if (nombreContacto != null && nombreContacto.contains(" ")) {
            int lastSpace = nombreContacto.lastIndexOf(" ");
            nombre = nombreContacto.substring(0, lastSpace);
            apellido = nombreContacto.substring(lastSpace + 1);
        }
        
        adminTenant.setNombre(nombre);
        adminTenant.setApellido(apellido);
        adminTenant.setEmail(sol.getEmailContacto());
        
        // El username será la parte antes del @ del correo (Ej. contacto@escuela.com -> username: contacto)
        String baseUsername = sol.getEmailContacto().split("@")[0];
        if (usuarioRepo.existsByUsername(baseUsername)) {
            baseUsername = baseUsername + "_" + idSolicitud; // Para evitar usernames duplicados
        }
        adminTenant.setUsername(baseUsername);
        
        // Contraseña por defecto: "12345"
        adminTenant.setPassword(passwordEncoder.encode("12345"));
        adminTenant.setFechaRegistro(LocalDate.now());
        adminTenant.setActivo(true); // Usuario activado de inmediato

        // Buscar el rol 'administrador'
        Rol rolAdmin = rolRepo.findByNombre("administrador")
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "El rol 'administrador' no existe en la base de datos."));
        adminTenant.setRol(rolAdmin);

        // Guardar el nuevo administrador
        usuarioRepo.save(adminTenant);
    }

    // Lógica para RECHAZAR una solicitud
    @Transactional
    public void rechazarSolicitud(Integer idSolicitud) {
        SolicitudInstitucion sol = solicitudRepo.findById(idSolicitud)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Solicitud no encontrada"));

        if (sol.getEstado() != EstadoSolicitud.PENDIENTE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La solicitud ya fue procesada anteriormente.");
        }

        sol.setEstado(EstadoSolicitud.RECHAZADA);
        sol.setFechaResolucion(LocalDateTime.now());
        solicitudRepo.save(sol);
    }
}