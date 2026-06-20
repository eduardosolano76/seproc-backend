package com.example.demo.controller;

import java.util.Map;

import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.AdminMeResponse;
import com.example.demo.modelo.AdminSistema;
import com.example.demo.repository.AdminSistemaRepository;
import com.example.demo.service.AdminSistemaService;
import org.springframework.security.core.Authentication;

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
	
    @GetMapping("/csrf")
    public Map<String, String> csrf(CsrfToken token) {
        return Map.of(
                "token", token.getToken(),
                "headerName", token.getHeaderName()
        );
    }

    @GetMapping("/me")
    public AdminMeResponse me(Authentication authentication) {
        AdminSistema admin = adminSistemaRepo
                .findByUsername(authentication.getName())
                .orElse(null);

        String nombreUsuario = admin != null && admin.getNombre() != null
                ? admin.getNombre()
                : authentication.getName();

        boolean esSuperAdmin = authentication.getAuthorities()
                .stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_SUPERADMIN"));

        return new AdminMeResponse(
                nombreUsuario,
                esSuperAdmin ? "Súper Administrador" : "Usuario"
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
