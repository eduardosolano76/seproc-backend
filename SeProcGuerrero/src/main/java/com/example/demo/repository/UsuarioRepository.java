package com.example.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.demo.modelo.Institucion;
import com.example.demo.modelo.Usuario;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

	// -- Metodos globales --
	@Query("SELECT u FROM Usuario u WHERE u.username = :username")
	Optional<Usuario> findByUsername(@Param("username") String username);

	// Validaciones de registro (evita duplicados globales)
	boolean existsByUsername(String username);

	boolean existsByEmail(String email);

	// -- Metodos multitenant (Con institucion obligatoria) --

	// Busca usuarios de una institución específica y con un rol específico
	List<Usuario> findByInstitucionAndRol_NombreIgnoreCase(Institucion institucion, String nombreRol);

	// Busca las solicitudes de registro pendientes DE ESA INSTITUCIÓN
	List<Usuario> findByInstitucionAndActivoFalse(Institucion institucion);

	// Busca usuarios aprobados por rol DE ESA INSTITUCIÓN
	List<Usuario> findByInstitucionAndActivoTrueAndRol_NombreIgnoreCase(Institucion institucion, String nombreRol);

	// Para listar a todos los usuarios de la empresa
	List<Usuario> findByInstitucion(Institucion institucion);

}
