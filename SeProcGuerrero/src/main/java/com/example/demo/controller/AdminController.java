package com.example.demo.controller;

import java.security.Principal;
import java.util.List;
import java.util.Map;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.dto.CambiarPasswordDto;
import com.example.demo.dto.UsuarioUpsertDto;
import com.example.demo.modelo.Usuario;
import com.example.demo.service.AdminService;
import com.example.demo.service.PerfilService;
import com.example.demo.service.UsuarioService;
import com.example.demo.storage.StorageService;

@Controller
public class AdminController {

	// Inyección de dependencias a través del constructor
	private final AdminService adminService;

	private final UsuarioService usuarioService;

	private final PerfilService perfilService;

	private final StorageService storageService;

	// Constructor para inyectar las dependencias
	public AdminController(AdminService adminService, UsuarioService usuarioService, PerfilService perfilService,
			StorageService storageService) {
		this.adminService = adminService;
		this.usuarioService = usuarioService;
		this.perfilService = perfilService;
		this.storageService = storageService;
	}

	// Método para manejar las solicitudes GET a la ruta "/admin",
	// mostrando la vista del admin con la información del usuario logueado,
	@GetMapping("/admin")
	public String admin(Model model, Principal principal,
			@RequestParam(value = "view", required = false, defaultValue = "solicitudes") String view,
			@RequestHeader(value = "X-Requested-With", required = false) String requestedWith) {

		// username del que inició sesión
		String username = principal.getName();

		// Para mostrar el username en el header del admin
		model.addAttribute("loggedUsername", username);

		// Se intenta obtener el usuario para mostrar su nombre completo, rol y foto de
		// perfil.
		// Si no se encuentra, se muestra el username y rol "sin rol" por defecto.
		Usuario usuario = null;

		// Se captura la excepción que lanza el servicio si el usuario no se encuentra,
		// para conservar el comportamiento actual sin mostrar errores en el admin.
		try {
			usuario = perfilService.obtenerUsuarioPorUsername(username);
		}
		catch (ResponseStatusException ex) {
			// Se conserva comportamiento actual
		}

		// Si se encuentra el usuario, se obtiene su nombre completo, rol y foto de
		// perfil.
		// Si no tiene foto, se muestra una imagen por defecto.
		if (usuario != null) {
			String nombreCompleto = usuario.getNombre();
			String rol = (usuario.getRol() != null) ? usuario.getRol().getNombre() : "sin rol";

			String fotoUrl = storageService.publicUrl(usuario.getFoto());
			if (fotoUrl == null || fotoUrl.isBlank()) {
				fotoUrl = "/assets/iconos/sinFotoPerfil.png";
			}

			model.addAttribute("fotoUrl", fotoUrl);
			model.addAttribute("nombreUsuario", nombreCompleto);
			model.addAttribute("rolUsuario", rol);
			
			if (usuario.getInstitucion() != null) {
				model.addAttribute("logoEmpresa", storageService.publicLogoUrl(usuario.getInstitucion().getLogoUrl()));
			} else {
				model.addAttribute("logoEmpresa", "/assets/iconos/logo.jpg");
			}
		}
		else {
			model.addAttribute("fotoUrl", "/assets/iconos/sinFotoPerfil.png");
			model.addAttribute("nombreUsuario", username);
			model.addAttribute("rolUsuario", "sin rol");
		}

		// Se obtiene la lista de usuarios pendientes de aprobación para mostrarla en la
		// sección correspondiente del admin
		model.addAttribute("pendientes", adminService.obtenerPendientes());
		// Se agrega la vista solicitada al modelo para mostrarla en el admin
		model.addAttribute("view", view);

		// Se obtiene la lista de usuarios activos según la vista solicitada,
		// utilizando el servicio de usuario, y se agrega al modelo para mostrarla en el
		// admin
		List<Usuario> usuarios = usuarioService.listarUsuariosPorView(view);
		model.addAttribute("usuarios", usuarios);

		boolean isAjax = "XMLHttpRequest".equalsIgnoreCase(requestedWith);
		if (isAjax && view != null && view.startsWith("usuarios-")) {
			return "admin/_usuarios :: usuariosContent";
		}

		// Se agrega una lista vacía de proyectos al modelo para evitar errores en la
		// vista del admin,
		model.addAttribute("proyectos", List.of());
		// y se devuelve la vista del admin para mostrarla al usuario
		return "admin/admin";
	}

	// Método para manejar las solicitudes POST a la ruta "/admin/usuarios/{id}/aprobar",
	// aprobando al usuario con el ID especificado y asignándole el rol indicado,
	@PostMapping("/admin/usuarios/{id}/aprobar")
	public String aprobarUsuario(@PathVariable Long id, @RequestParam String rolNombre) {
		adminService.aprobarUsuario(id, rolNombre);
		return "redirect:/admin?view=pendientes";
	}

	// Método para manejar las solicitudes POST a la ruta "/admin/usuarios/{id}/rechazar"
	@PostMapping("/admin/usuarios/{id}/rechazar")
	public String rechazarUsuario(@PathVariable Long id) {
		adminService.rechazarUsuario(id);
		return "redirect:/admin?view=pendientes";
	}

	// Método para manejar las solicitudes GET a la ruta "/admin/usuarios/{id}",
	// devolviendo la información del usuario en formato JSON
	@GetMapping("/admin/usuarios/{id}")
	@ResponseBody
	public ResponseEntity<Usuario> verUsuario(@PathVariable Long id) {
		Usuario u = usuarioService.obtenerPorId(id);
		return ResponseEntity.ok(u);
	}

	// Método para manejar las solicitudes POST a la ruta
	// "/admin/usuarios/{id}/actualizar",
	// actualizando la información del usuario con el ID especificado según los datos
	// recibidos en formato JSON
	@PostMapping("/admin/usuarios/{id}/actualizar")
	@ResponseBody
	public ResponseEntity<?> actualizarUsuario(@PathVariable Long id, @RequestBody UsuarioUpsertDto dto) {
		try {
			usuarioService.actualizarUsuario(id, dto);
			return ResponseEntity.ok(Map.of("message", "Usuario actualizado correctamente."));
		}
		catch (ResponseStatusException ex) {
			return ResponseEntity.status(ex.getStatusCode()).body(Map.of("message", ex.getReason()));
		}
	}

	// Método para manejar las solicitudes POST a la ruta "/admin/usuarios/{id}/eliminar",
	// eliminando al usuario con el ID especificado, con una validación para no
	// eliminar al usuario logueado, y devolviendo una respuesta JSON indicando el
	// resultado de la operación
	@PostMapping("/admin/usuarios/{id}/eliminar")
	@ResponseBody
	public ResponseEntity<?> eliminarUsuario(@PathVariable Long id, Principal principal) {
		try {
			usuarioService.eliminarUsuario(id, principal.getName());
			return ResponseEntity.ok(Map.of("message", "Usuario eliminado correctamente."));
		}
		catch (ResponseStatusException ex) {
			return ResponseEntity.status(ex.getStatusCode()).body(Map.of("message", ex.getReason()));
		}
		catch (DataIntegrityViolationException ex) {
			return ResponseEntity.status(HttpStatus.CONFLICT)
				.body(Map.of("message", "No se puede eliminar el usuario porque tiene datos relacionados."));
		}
	}

	// Método para manejar las solicitudes POST a la ruta "/admin/usuarios/crear",
	// creando un nuevo usuario según los datos recibidos en formato JSON
	@PostMapping("/admin/usuarios/crear")
	@ResponseBody
	public ResponseEntity<?> crearUsuario(@RequestBody UsuarioUpsertDto dto) {
		try {
			usuarioService.crearUsuario(dto);
			return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Usuario creado correctamente."));
		}
		catch (ResponseStatusException ex) {
			return ResponseEntity.status(ex.getStatusCode()).body(Map.of("message", ex.getReason()));
		}
	}

	// Método para manejar las solicitudes POST a la ruta "/perfil/foto",
	// subiendo una nueva foto de perfil para el usuario logueado, recibiendo
	// el archivo de la foto en formato multipart/form-data,
	// y devolviendo una respuesta JSON con la URL pública de la nueva foto
	@PostMapping(value = "/admin/perfil/foto", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@ResponseBody
	public ResponseEntity<?> subirFotoPerfil(@RequestParam("file") MultipartFile file, Principal principal) {
		Map<String, String> response = perfilService.subirFotoPerfil(file, principal.getName());
		return ResponseEntity.ok(response);
	}

	// Método para manejar las solicitudes GET a la ruta "/perfil/foto"
	@GetMapping("/admin/perfil/foto")
	@ResponseBody
	public ResponseEntity<?> obtenerFotoPerfil(Principal principal) {
		Map<String, String> response = perfilService.obtenerFotoPerfil(principal.getName());
		return ResponseEntity.ok(response);
	}

	// Método para manejar las solicitudes POST a la ruta "/perfil/password",
	// cambiando la contraseña del usuario logueado según los datos recibidos
	@PostMapping("/admin/perfil/password")
	@ResponseBody
	public ResponseEntity<?> cambiarPassword(@RequestBody CambiarPasswordDto dto, Principal principal) {
		perfilService.cambiarPassword(principal.getName(), dto);
		return ResponseEntity.ok().build();
	}

	// Método para manejar las solicitudes DELETE a la ruta "/perfil/foto"
	@DeleteMapping("/admin/perfil/foto")
	@ResponseBody
	public ResponseEntity<?> eliminarFotoPerfil(Principal principal) {
		perfilService.eliminarFotoPerfil(principal.getName());
		return ResponseEntity
			.ok(Map.of("message", "Foto eliminada correctamente", "url", "/assets/iconos/sinFotoPerfil.png"));
	}

}
