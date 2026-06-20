package com.example.demo.controller;

import java.security.Principal;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.modelo.AdminSistema;
import com.example.demo.repository.AdminSistemaRepository;
import com.example.demo.service.AdminSistemaService;

@RestController
@RequestMapping("/api/admin-seproc")
public class AdminSistemaApiController {

	private final AdminSistemaService adminSistemaService;
	private final AdminSistemaRepository adminSistemaRepo; 

	// Constructor con ambas dependencias
	public AdminSistemaApiController(AdminSistemaService adminSistemaService, AdminSistemaRepository adminSistemaRepo) {
		this.adminSistemaService = adminSistemaService;
		this.adminSistemaRepo = adminSistemaRepo;
	}
	
    @GetMapping("/me")
    public Map<String, Object> me(Principal principal) {
        AdminSistema admin = adminSistemaRepo
                .findByUsername(principal.getName())
                .orElse(null);

        String nombreUsuario = admin != null ? admin.getNombre() : principal.getName();

        return Map.of(
                "nombreUsuario", nombreUsuario,
                "rolUsuario", "Súper Administrador"
        );
    }

    @GetMapping("/solicitudes/pendientes")
    public Object pendientes() {
        return adminSistemaService.obtenerSolicitudesPendientes();
    }

    @PostMapping("/solicitudes/{id}/aprobar")
    public Map<String, String> aprobarSolicitud(@PathVariable Integer id) {
        adminSistemaService.aprobarSolicitud(id);

        return Map.of(
                "mensaje", "Institución y cuenta de Administrador creadas con éxito"
        );
    }

    @PostMapping("/solicitudes/{id}/rechazar")
    public Map<String, String> rechazarSolicitud(@PathVariable Integer id) {
        adminSistemaService.rechazarSolicitud(id);

        return Map.of(
                "mensaje", "La solicitud ha sido rechazada correctamente"
        );
    }
}
