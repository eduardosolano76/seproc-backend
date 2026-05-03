package com.example.demo.repository;

import com.example.demo.modelo.CatEstado;
import com.example.demo.modelo.CatMunicipio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CatMunicipioRepository extends JpaRepository<CatMunicipio, Integer> {

	Optional<CatMunicipio> findByEstadoAndCveMunicipio(CatEstado estado, String cveMunicipio);

	List<CatMunicipio> findByEstadoOrderByNombreAsc(CatEstado estado);

	List<CatMunicipio> findByEstado_IdEstadoOrderByNombreAsc(Integer idEstado);

}