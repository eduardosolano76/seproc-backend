package com.example.demo.service;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.dto.CambiarPasswordDto;
import com.example.demo.modelo.Usuario;
import com.example.demo.repository.UsuarioRepository;
import com.example.demo.storage.StorageService;

@Service
public class PerfilService {

	// Inyección de dependencias a través del constructor
	private final UsuarioRepository usuarioRepo;

	private final PasswordEncoder passwordEncoder;

	private final StorageService storageService;

	// Constructor para inyectar las dependencias
	public PerfilService(UsuarioRepository usuarioRepo, PasswordEncoder passwordEncoder,
			StorageService storageService) {
		this.usuarioRepo = usuarioRepo;
		this.passwordEncoder = passwordEncoder;
		this.storageService = storageService;
	}

	// Método para obtener un usuario por su username, lanzando una excepción si no se
	// encuentra
	public Usuario obtenerUsuarioPorUsername(String username) {
		return usuarioRepo.findByUsername(username)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado."));
	}

	// Método para subir una foto de perfil, eliminando la anterior si existe, guardando
	// la nueva y devolviendo la URL pública
	public Map<String, String> subirFotoPerfil(MultipartFile file, String username) {
		Usuario u = obtenerUsuarioPorUsername(username);

		storageService.deleteIfExists(u.getFoto());

		String key = storageService.saveProfilePhoto(u.getIdUsuario(), u.getUsername(), file);
		u.setFoto(key);
		usuarioRepo.save(u);

		String url = storageService.publicUrl(key);
		return Map.of("url", url);
	}

	// Método para obtener la foto de perfil de un usuario, devolviendo la URL pública
	public Map<String, String> obtenerFotoPerfil(String username) {
		Usuario u = obtenerUsuarioPorUsername(username);

		String url = storageService.publicUrl(u.getFoto());
		return Map.of("url", url);
	}

	// Método para cambiar la contraseña de un usuario,
	// validando la contraseña actual, la nueva contraseña
	// y su confirmación, y guardando la nueva contraseña codificada
	public void cambiarPassword(String username, CambiarPasswordDto dto) {
		Usuario usuario = obtenerUsuarioPorUsername(username);

		if (dto.getPassActual() == null || dto.getPassActual().isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La contraseña actual es obligatoria.");
		}

		if (dto.getPassNueva() == null || dto.getPassNueva().isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La nueva contraseña es obligatoria.");
		}

		if (dto.getPassRepetida() == null || dto.getPassRepetida().isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debes repetir la nueva contraseña.");
		}

		if (!passwordEncoder.matches(dto.getPassActual(), usuario.getPassword())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La contraseña actual es incorrecta.");
		}

		boolean tieneNumero = dto.getPassNueva().matches(".*\\d.*");
		boolean tieneEspecial = dto.getPassNueva().matches(".*[^A-Za-z0-9].*");

		if (dto.getPassNueva().length() < 8 || !tieneNumero || !tieneEspecial) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"La nueva contraseña debe tener 8 caracteres como mínimo, 1 número y 1 caracter especial.");
		}

		if (!dto.getPassNueva().equals(dto.getPassRepetida())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Las contraseñas nuevas no coinciden.");
		}

		usuario.setPassword(passwordEncoder.encode(dto.getPassNueva()));
		usuarioRepo.save(usuario);
	}

	// Método para eliminar la foto de perfil del usuario logueado
	public void eliminarFotoPerfil(String username) {
		Usuario u = obtenerUsuarioPorUsername(username);

		if (u.getFoto() != null && !u.getFoto().isBlank()) {
			storageService.deleteIfExists(u.getFoto()); // Elimina del disco físico
			u.setFoto(null); // Borra la referencia en el objeto
			usuarioRepo.save(u); // Guarda en la base de datos
		}
	}

}
