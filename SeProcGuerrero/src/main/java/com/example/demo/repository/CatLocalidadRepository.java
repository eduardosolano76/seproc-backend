package com.example.demo.repository;

import com.example.demo.modelo.CatLocalidad;
import com.example.demo.modelo.CatMunicipio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CatLocalidadRepository extends JpaRepository<CatLocalidad, Long> {

	boolean existsByMunicipioAndCveLocalidad(CatMunicipio municipio, String cveLocalidad);

	List<CatLocalidad> findByMunicipioOrderByNombreAsc(CatMunicipio municipio);

	List<CatLocalidad> findByMunicipio_IdMunicipioOrderByNombreAsc(Integer idMunicipio);

}