package com.example.demo.controller;

import java.security.Principal;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import com.example.demo.modelo.AdminSistema;
import com.example.demo.repository.AdminSistemaRepository;
import com.example.demo.service.AdminSistemaService;

@Controller
@RequestMapping("/admin-seproc")
public class AdminSistemaController {

	private final AdminSistemaService adminSistemaService;
	private final AdminSistemaRepository adminSistemaRepo; // Inyectamos tu repositorio

	// Constructor con ambas dependencias
	public AdminSistemaController(AdminSistemaService adminSistemaService, AdminSistemaRepository adminSistemaRepo) {
		this.adminSistemaService = adminSistemaService;
		this.adminSistemaRepo = adminSistemaRepo;
	}

	// Mostrar la pantalla de Login exclusiva de SeProc
	@GetMapping("/login-seproc")
	public String login() {
		return "adminSistema/login";
	}

	// Mostrar el Dashboard principal
	@GetMapping("/dashboard-seproc")
	public String dashboard(Model model, Principal principal) {

		AdminSistema admin = adminSistemaRepo.findByUsername(principal.getName()).orElse(null);

		if (admin != null) {
			model.addAttribute("nombreUsuario", admin.getNombre());
		} else {
			model.addAttribute("nombreUsuario", principal.getName());
		}

		model.addAttribute("rolUsuario", "Súper Administrador");
		model.addAttribute("pendientes", adminSistemaService.obtenerSolicitudesPendientes());

		return "adminSistema/dashboard";
	}
	
	// Ruta para el botón de Aprobar
    @PostMapping("/solicitudes/{id}/aprobar")
    public String aprobarSolicitud(@PathVariable Integer id) {
        adminSistemaService.aprobarSolicitud(id);
        return "redirect:/admin-seproc/dashboard-seproc?exito=aprobada";
    }

    // Ruta para el botón de Rechazar
    @PostMapping("/solicitudes/{id}/rechazar")
    public String rechazarSolicitud(@PathVariable Integer id) {
        adminSistemaService.rechazarSolicitud(id);
        return "redirect:/admin-seproc/dashboard-seproc?exito=rechazada";
    }
}
