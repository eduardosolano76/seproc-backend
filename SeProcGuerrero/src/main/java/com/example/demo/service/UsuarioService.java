package com.example.demo.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.dto.UsuarioUpsertDto;
import com.example.demo.modelo.Institucion;
import com.example.demo.modelo.Rol;
import com.example.demo.modelo.Usuario;
import com.example.demo.repository.RolRepository;
import com.example.demo.repository.UsuarioRepository;

@Service
public class UsuarioService {

	// Inyección de dependencias a través del constructor
	private final UsuarioRepository usuarioRepo;
	private final RolRepository rolRepo;
	private final PasswordEncoder passwordEncoder;
	private final SeguridadService seguridadService;

	// Constructor para inyectar las dependencias
	public UsuarioService(UsuarioRepository usuarioRepo, RolRepository rolRepo, PasswordEncoder passwordEncoder,
			SeguridadService seguridadService) {
		this.usuarioRepo = usuarioRepo;
		this.rolRepo = rolRepo;
		this.passwordEncoder = passwordEncoder;
		this.seguridadService = seguridadService;
	}

	// Método para obtener un usuario por su ID, lanzando una excepción si no se
	// encuentra
	public Usuario obtenerPorId(Long id) {
		Usuario u = usuarioRepo.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado."));

		// Verificamos que el usuario que intentan consultar pertenezca a la institución
		// del administrador logueado
		Institucion miInstitucion = seguridadService.getInstitucionActual();
		if (miInstitucion != null && !u.getInstitucion().getIdInstitucion().equals(miInstitucion.getIdInstitucion())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN,
					"Acceso denegado. Este usuario pertenece a otra institución.");
		}
		return u;
	}

	// Método para listar usuarios activos según la vista solicitada, utilizando un
	// switch para determinar el rol
	public List<Usuario> listarUsuariosPorView(String view) {
		Institucion miInstitucion = seguridadService.getInstitucionActual(); // Obtenemos la institución

		return switch (view) {
		case "usuarios-supervisores" ->
			usuarioRepo.findByInstitucionAndActivoTrueAndRol_NombreIgnoreCase(miInstitucion, "supervisor");
		case "usuarios-constructores" ->
			usuarioRepo.findByInstitucionAndActivoTrueAndRol_NombreIgnoreCase(miInstitucion, "contratista");
		case "usuarios-directores" ->
			usuarioRepo.findByInstitucionAndActivoTrueAndRol_NombreIgnoreCase(miInstitucion, "direccion");
		case "usuarios-central" ->
			usuarioRepo.findByInstitucionAndActivoTrueAndRol_NombreIgnoreCase(miInstitucion, "central");
		case "usuarios-administrador" ->
			usuarioRepo.findByInstitucionAndActivoTrueAndRol_NombreIgnoreCase(miInstitucion, "administrador");
		default -> List.of();
		};
	}

	// Método para crear un nuevo usuario, validando los campos obligatorios y la
	// unicidad de username y email
	public Usuario crearUsuario(UsuarioUpsertDto dto) {
		if (dto.getPassword() == null || dto.getPassword().isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password es obligatorio.");
		}

		if (dto.getUsername() == null || dto.getUsername().isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username es obligatorio.");
		}

		if (dto.getEmail() == null || dto.getEmail().isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email es obligatorio.");
		}

		if (dto.getNombre() == null || dto.getNombre().isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nombre es obligatorio.");
		}

		if (dto.getApellido() == null || dto.getApellido().isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Apellido es obligatorio.");
		}

		if (usuarioRepo.existsByUsername(dto.getUsername())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username ya existe.");
		}

		if (usuarioRepo.existsByEmail(dto.getEmail())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email ya existe.");
		}

		Usuario u = new Usuario();
		u.setNombre(dto.getNombre());
		u.setApellido(dto.getApellido());
		u.setUsername(dto.getUsername());
		u.setEmail(dto.getEmail());
		u.setPassword(passwordEncoder.encode(dto.getPassword()));
		u.setActivo(true);

		// Atamos al nuevo usuario a la empresa de quien lo está creando
		u.setInstitucion(seguridadService.getInstitucionActual());

		if (dto.getRolNombre() != null && !dto.getRolNombre().isBlank()) {
			Rol rol = rolRepo.findByNombre(dto.getRolNombre())
					.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rol no válido."));
			u.setRol(rol);
		}

		return usuarioRepo.save(u);
	}

	// Método para actualizar un usuario existente, validando que no se edite el
	// admin y que los campos username y email sean únicos
	public Usuario actualizarUsuario(Long id, UsuarioUpsertDto dto) {
		Usuario u = obtenerPorId(id);

		if ("admin".equalsIgnoreCase(u.getUsername())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No se puede editar el admin.");
		}

		if (dto.getNombre() == null || dto.getNombre().isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nombre es obligatorio.");
		}

		if (dto.getApellido() == null || dto.getApellido().isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Apellido es obligatorio.");
		}

		if (dto.getUsername() == null || dto.getUsername().isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username es obligatorio.");
		}

		if (dto.getEmail() == null || dto.getEmail().isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email es obligatorio.");
		}

		if (dto.getUsername() != null && !dto.getUsername().equalsIgnoreCase(u.getUsername())
				&& usuarioRepo.existsByUsername(dto.getUsername())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username ya existe.");
		}

		if (dto.getEmail() != null && !dto.getEmail().equalsIgnoreCase(u.getEmail())
				&& usuarioRepo.existsByEmail(dto.getEmail())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email ya existe.");
		}

		u.setNombre(dto.getNombre());
		u.setApellido(dto.getApellido());
		u.setUsername(dto.getUsername());
		u.setEmail(dto.getEmail());

		if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
			u.setPassword(passwordEncoder.encode(dto.getPassword()));
		}

		if (dto.getRolNombre() != null && !dto.getRolNombre().isBlank()) {
			Rol rol = rolRepo.findByNombre(dto.getRolNombre())
					.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rol no válido."));
			u.setRol(rol);
		}

		return usuarioRepo.save(u);
	}

	// Método para eliminar un usuario, validando que no se elimine el propio
	// usuario logueado
	public void eliminarUsuario(Long id, String loggedUsername) {
		Usuario u = obtenerPorId(id);

		if (u.getUsername() != null && u.getUsername().equalsIgnoreCase(loggedUsername)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN,
					"No puedes eliminar tu propio usuario mientras estás logueado.");
		}

		usuarioRepo.deleteById(id);
	}
}
