package com.example.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.demo.modelo.Institucion;

public interface InstitucionRepository extends JpaRepository<Institucion, String> {
	
    Optional<Institucion> findByAbreviacionIgnoreCase(String abreviacion);

    List<Institucion> findByActiva(Integer activa);

    boolean existsByAbreviacionIgnoreCase(String abreviacion);
    boolean existsBySchemaName(String schemaName);

}
