package com.example.demo.repository;

import com.example.demo.modelo.CatEstado;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CatEstadoRepository extends JpaRepository<CatEstado, Integer> {

	Optional<CatEstado> findByCveEstado(String cveEstado);

}