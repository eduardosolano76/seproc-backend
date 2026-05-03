package com.example.demo.repository;

import com.example.demo.modelo.ProyectoEtapaEntrega;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProyectoEtapaEntregaRepository extends JpaRepository<ProyectoEtapaEntrega, Long> {

	long countByProyectoEtapa_IdProyectoEtapa(Long idProyectoEtapa);

	Optional<ProyectoEtapaEntrega> findFirstByProyectoEtapa_IdProyectoEtapaOrderByVersionDesc(Long idProyectoEtapa);

	List<ProyectoEtapaEntrega> findByProyectoEtapa_IdProyectoEtapaOrderByVersionDesc(Long idProyectoEtapa);

}