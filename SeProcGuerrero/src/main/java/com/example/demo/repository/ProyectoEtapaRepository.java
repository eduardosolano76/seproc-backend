package com.example.demo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.demo.modelo.ProyectoEtapa;

@Repository
public interface ProyectoEtapaRepository extends JpaRepository<ProyectoEtapa, Long> {

	List<ProyectoEtapa> findByProyecto_IdProyectoOrderByOrdenVisualAsc(Integer idProyecto);

	Optional<ProyectoEtapa> findByProyecto_IdProyectoAndEtapaPlantilla_ClaveInternaAndNumeroNivel(Integer idProyecto,
			String claveInterna, Integer numeroNivel);

	Optional<ProyectoEtapa> findByProyecto_IdProyectoAndEtapaPlantilla_ClaveInternaAndNumeroNivelIsNull(
			Integer idProyecto, String claveInterna);

	Optional<ProyectoEtapa> findFirstByProyecto_IdProyectoAndOrdenVisualGreaterThanAndEstadoOrderByOrdenVisualAsc(
			Integer idProyecto, Integer ordenVisual, String estado);

	@Query("SELECT pe FROM ProyectoEtapa pe " + "JOIN pe.etapaPlantilla ep "
			+ "WHERE pe.proyecto.idProyecto = :idProyecto " + "AND ep.claveInterna = :claveInterna "
			+ "AND (pe.numeroNivel = :numeroNivel OR (pe.numeroNivel IS NULL AND :numeroNivel IS NULL))")
	Optional<ProyectoEtapa> findByClaveInternaAndNivel(@Param("idProyecto") Integer idProyecto,
			@Param("claveInterna") String claveInterna, @Param("numeroNivel") Integer numeroNivel);

}