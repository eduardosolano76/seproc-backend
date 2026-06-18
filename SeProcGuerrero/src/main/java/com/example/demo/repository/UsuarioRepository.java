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
	
    @Query("""
            SELECT u
            FROM Usuario u
            JOIN FETCH u.institucion i
            LEFT JOIN FETCH u.rol r
            WHERE LOWER(u.username) = LOWER(:username)
              AND LOWER(i.abreviacion) = LOWER(:abreviacion)
        """)
    Optional<Usuario> findByUsernameAndInstitucionAbreviacion(
            @Param("username") String username,
            @Param("abreviacion") String abreviacion
    );
	
    @Query("""
            SELECT i.schemaName
            FROM Usuario u
            JOIN u.institucion i
            WHERE u.username = :username
        """)
        Optional<String> findSchemaNameByUsername(@Param("username") String username);

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


}
